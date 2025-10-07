import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "./StatusBadge";
import { ServiceBadge } from "./ServiceBadge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Droplet, Zap } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Incident, ServiceType } from '@/types/incident';
import { generateMockIncidents } from '@/lib/mock-data';

const USE_MOCK_DATA = true; // Set to true to use mock data

export const IncidentsList = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Debounce for 500ms
    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  useEffect(() => {
    fetchIncidents();

    // Only subscribe to realtime changes if not using mock data
    if (!USE_MOCK_DATA) {
      const channel = supabase
        .channel('incidents-list')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'incidents'
          },
          () => {
            fetchIncidents();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [debouncedSearchTerm, statusFilter, serviceFilter]);

  const fetchIncidents = async () => {
    setLoading(true);
    if (USE_MOCK_DATA) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      let mockData = generateMockIncidents(20);

      if (debouncedSearchTerm) {
        mockData = mockData.filter(
          (incident) =>
            incident.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            incident.sectors?.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
      }

      if (statusFilter !== "all") {
        mockData = mockData.filter((incident) => incident.status === statusFilter);
      }

      if (serviceFilter !== "all") {
        mockData = mockData.filter((incident) => incident.service_type === serviceFilter);
      }
      setIncidents(mockData);
    } else {
      let query = supabase
        .from("incidents")
        .select("*, sectors(name)")
        .order("start_time", { ascending: false });

      if (debouncedSearchTerm) {
        query = query.or(
          `title.ilike.%${debouncedSearchTerm}%,sectors.name.ilike.%${debouncedSearchTerm}%`
        );
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (serviceFilter !== "all") {
        query = query.eq("service_type", serviceFilter);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les incidents",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setIncidents(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par secteur ou titre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="ongoing">En cours</SelectItem>
            <SelectItem value="scheduled">Programmé</SelectItem>
            <SelectItem value="resolved">Résolu</SelectItem>
          </SelectContent>
        </Select>
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les services</SelectItem>
            <SelectItem value="water">Eau</SelectItem>
            <SelectItem value="electricity">Électricité</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {incidents.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Aucun incident trouvé</p>
          </Card>
        ) : (
          incidents.map((incident) => (
            <Dialog key={incident.id} onOpenChange={(open) => !open && setSelectedIncident(null)}>
              <DialogTrigger asChild>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedIncident(incident)}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-lg">{incident.title}</h3>
                        {incident.service_type === "water" ? (
                          <Droplet className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Zap className="h-5 w-5 text-yellow-500" />
                        )}
                        <ServiceBadge service={incident.service_type} />
                        <StatusBadge status={incident.status} />
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Secteur: <span className="font-medium">{incident.sectors.name}</span>
                      </p>

                      {incident.description && (
                        <p className="text-sm">{incident.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Début:</span>{" "}
                          {format(new Date(incident.start_time), "Pp", { locale: fr })}
                        </div>
                        {incident.expected_end_time && (
                          <div>
                            <span className="font-medium">Fin prévue:</span>{" "}
                            {format(new Date(incident.expected_end_time), "Pp", { locale: fr })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </DialogTrigger>
              {selectedIncident && (
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{selectedIncident.title}</DialogTitle>
                    <DialogDescription>{selectedIncident.description}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <p><strong>Secteur:</strong> {selectedIncident.sectors.name}</p>
                    <p><strong>Type de service:</strong> {selectedIncident.service_type}</p>
                    <p><strong>Statut:</strong> {selectedIncident.status}</p>
                    <p><strong>Début:</strong> {format(new Date(selectedIncident.start_time), "Pp", { locale: fr })}</p>
                    {selectedIncident.expected_end_time && (
                      <p><strong>Fin prévue:</strong> {format(new Date(selectedIncident.expected_end_time), "Pp", { locale: fr })}</p>
                    )}
                  </div>
                </DialogContent>
              )}
            </Dialog>
          ))
        )}
      </div>
    </div>
  );
};
