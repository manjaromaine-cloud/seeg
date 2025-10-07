import React, { useEffect, useState, useMemo } from 'react';
import { Calendar } from './ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { format, isSameDay, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Incident, ServiceType } from '@/types/incident';
import { generateMockIncidents } from '@/lib/mock-data';

const USE_MOCK_DATA = true; // Set to true to use mock data

export const OutageCalendar: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchIncidents();

    // Only subscribe to realtime changes if not using mock data
    if (!USE_MOCK_DATA) {
      const channel = supabase
        .channel('outage-calendar-changes')
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
  }, [serviceFilter]); // Re-fetch when serviceFilter changes

  const fetchIncidents = async () => {
    setLoading(true);
    if (USE_MOCK_DATA) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      let mockData = generateMockIncidents(20).filter(inc => inc.status === "scheduled" || inc.status === "ongoing");

      if (serviceFilter !== "all") {
        mockData = mockData.filter((incident) => incident.service_type === serviceFilter);
      }
      setIncidents(mockData);
    } else {
      let query = supabase
        .from("incidents")
        .select("*")
        .or("status.eq.scheduled,status.eq.ongoing");

      if (serviceFilter !== "all") {
        query = query.eq("service_type", serviceFilter);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les incidents pour le calendrier",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setIncidents(data || []);
    }
    setLoading(false);
  };

  const datesWithOutages = useMemo(() => {
    const dates = new Set<string>();
    incidents.forEach(incident => {
      const start = new Date(incident.start_time);
      const end = incident.expected_end_time ? new Date(incident.expected_end_time) : start;

      let currentDate = new Date(start);
      while (currentDate <= end) {
        dates.add(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addDays(currentDate, 1);
      }
    });
    return dates;
  }, [incidents]);

  const getIncidentsForSelectedDate = (date: Date) => {
    return incidents.filter(incident => {
      const start = new Date(incident.start_time);
      const end = incident.expected_end_time ? new Date(incident.expected_end_time) : null;

      return (
        isSameDay(date, start) ||
        (end && isSameDay(date, end)) ||
        (date > start && end && date < end)
      );
    });
  };

  const modifiers = {
    outage: (date: Date) => datesWithOutages.has(format(date, 'yyyy-MM-dd')),
  };

  const modifiersClassNames = {
    outage: "bg-red-500 text-white rounded-full",
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Calendrier des Coupures</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex justify-center flex-col items-center space-y-4">
          <div className="w-full max-w-[300px]">
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrer par service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les services</SelectItem>
                <SelectItem value="water">Eau</SelectItem>
                <SelectItem value="electricity">Électricité</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            locale={fr}
          />
          <div className="flex items-center gap-2 mt-4">
            <span className="w-4 h-4 bg-red-500 rounded-full"></span>
            <span className="text-sm text-muted-foreground">Jour avec coupure</span>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <h3 className="text-lg font-semibold">
            Incidents pour le {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : "date non sélectionnée"}
          </h3>
          {
            loading ? (
              <p>Chargement des incidents...</p>
            ) : (
              (() => {
                const incidentsForDisplay = getIncidentsForSelectedDate(selectedDate || new Date());
                return incidentsForDisplay.length > 0 ? (
                  incidentsForDisplay.map(incident => (
                    <div key={incident.id} className="border-l-4 border-red-500 pl-3 py-2">
                      <h4 className="font-medium">{incident.title}</h4>
                      <p className="text-sm text-muted-foreground">Statut: {incident.status}</p>
                      <p className="text-sm text-muted-foreground">Service: {incident.service_type}</p>
                      {incident.description && <p className="text-sm">{incident.description}</p>}
                      <p className="text-xs text-muted-foreground">
                        Début: {format(new Date(incident.start_time), "Pp", { locale: fr })}
                        {incident.expected_end_time && ` - Fin prévue: ${format(new Date(incident.expected_end_time), "Pp", { locale: fr })}`}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Aucun incident programmé ou en cours pour cette date.</p>
                );
              })()
            )
          }
        </div>
      </CardContent>
    </Card>
  );
};
