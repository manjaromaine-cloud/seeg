import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Incident, IncidentStatus, ServiceType } from '@/types/incident';

// Fix for default marker icon issue with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export const MapView = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchIncidents();
    
    // Subscribe to realtime incident updates
    const channel = supabase
      .channel('incidents-changes')
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
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("incidents")
      .select("*, latitude, longitude")
      .in("status", ["ongoing", "scheduled"])
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les incidents",
        variant: "destructive",
      });
      return;
    }

    setIncidents(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="w-full h-[600px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  const defaultCenter: [number, number] = [0.4162, 9.4527]; // Libreville coordinates
  const defaultZoom = 13;

  return (
    <Card className="w-full h-[600px] p-0 overflow-hidden">
      <MapContainer center={defaultCenter} zoom={defaultZoom} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {incidents.map((incident) => (
          <Marker key={incident.id} position={[incident.latitude, incident.longitude]}>
            <Popup>
              <div className="space-y-1">
                <h4 className="font-semibold">{incident.title}</h4>
                <p className="text-sm">Status: {incident.status}</p>
                <p className="text-sm">Service: {incident.service_type}</p>
                {incident.description && <p className="text-sm">{incident.description}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Card>
  );
};
