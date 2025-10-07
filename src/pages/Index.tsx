import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { Incident } from '@/types/incident';
import { Droplet, Zap, Shield } from "lucide-react";
import { generateMockIncidents } from '@/lib/mock-data';

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncidentsList } from "@/components/IncidentsList";
import IncidentForm from "@/components/IncidentForm";
import { OutageCalendar } from "@/components/OutageCalendar";
import { ServiceBadge } from "@/components/ServiceBadge";

const USE_MOCK_DATA = true; // Set to true to use mock data

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [ongoingIncidents, setOngoingIncidents] = useState<Incident[]>([]);
  const [loadingOngoing, setLoadingOngoing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchOngoingIncidents();

    // Only subscribe to realtime changes if not using mock data
    if (!USE_MOCK_DATA) {
      const channel = supabase
        .channel('ongoing-incidents-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'incidents'
          },
          () => {
            fetchOngoingIncidents();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const fetchOngoingIncidents = async () => {
    setLoadingOngoing(true);
    if (USE_MOCK_DATA) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockData = generateMockIncidents(5).filter(inc => inc.status === "ongoing");
      setOngoingIncidents(mockData);
    } else {
      const { data, error } = await supabase
        .from("incidents")
        .select("*, sectors(name)")
        .eq("status", "ongoing")
        .order("start_time", { ascending: false });

      if (error) {
        console.error("Error fetching ongoing incidents:", error);
        setLoadingOngoing(false);
        return;
      }

      setOngoingIncidents(data || []);
    }
    setLoadingOngoing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-primary to-primary-hover text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Droplet className="h-12 w-12" />
                <Zap className="h-12 w-12 text-secondary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">SEEG Incidents</h1>
                <p className="text-lg opacity-90">
                  Suivi en temps réel des coupures d'eau et d'électricité
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {user ? (
                <Button
                  variant="secondary"
                  onClick={() => navigate("/admin")}
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Administration
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => navigate("/auth")}
                >
                  Connexion Admin
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Summary of Ongoing Incidents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Incidents en Cours</CardTitle>
            <CardDescription>Aperçu rapide des problèmes actuels</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOngoing ? (
              <p className="text-muted-foreground">Chargement des incidents en cours...</p>
            ) : ongoingIncidents.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(ongoingIncidents.reduce((acc, incident) => {
                  const sectorName = incident.sectors?.name || "Unknown Sector";
                  if (!acc[sectorName]) {
                    acc[sectorName] = [];
                  }
                  acc[sectorName].push(incident);
                  return acc;
                }, {} as Record<string, Incident[]>)).map(([sectorName, incidentsInSector]) => (
                  <div key={sectorName} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-3">Arrondissement: {sectorName}</h4>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {incidentsInSector.map((incident) => (
                        <div key={incident.id} className="border p-4 rounded-lg">
                          <h5 className="font-semibold">{incident.title}</h5>
                          <div className="flex items-center gap-2 mt-2">
                            <ServiceBadge service={incident.service_type} />
                            <StatusBadge status={incident.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucun incident en cours signalé.</p>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="list">Liste des incidents</TabsTrigger>
            <TabsTrigger value="calendar">Calendrier</TabsTrigger>
            <TabsTrigger value="report">Signaler un incident</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tous les incidents</CardTitle>
                <CardDescription>
                  Liste complète et recherche par secteur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IncidentsList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <OutageCalendar />
          </TabsContent>

          <TabsContent value="report" className="space-y-6">
            <IncidentForm />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} SEEG - Société d'Eau et d'Électricité du Gabon
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;