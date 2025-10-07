import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '../integrations/supabase/client';
import { IncidentStatus, ServiceType } from '@/types/incident';

interface IncidentFormProps {
  onIncidentCreated?: () => void;
}

const IncidentForm: React.FC<IncidentFormProps> = ({ onIncidentCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [startTime, setStartTime] = useState<Date | undefined>(new Date());
  const [expectedEndTime, setExpectedEndTime] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!serviceType) {
      setError('Please select a service type.');
      setLoading(false);
      return;
    }
    if (!startTime) {
      setError('Please select a start time.');
      setLoading(false);
      return;
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      setError('Latitude and Longitude must be valid numbers.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('incidents')
        .insert([{ 
          title, 
          description, 
          location, 
          latitude: lat, 
          longitude: lon, 
          service_type: serviceType, 
          status: 'reported' as IncidentStatus,
          start_time: startTime.toISOString(),
          expected_end_time: expectedEndTime ? expectedEndTime.toISOString() : null
        }]);

      if (error) {
        throw error;
      }

      setSuccess('Incident reported successfully!');
      setTitle('');
      setDescription('');
      setLocation('');
      setLatitude('');
      setLongitude('');
      setServiceType('');
      setStartTime(new Date());
      setExpectedEndTime(undefined);
      if (onIncidentCreated) {
        onIncidentCreated();
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Report New Incident</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="location">Location (Text)</Label>
            <Input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
              type="number"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
                step="any"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
                step="any"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="serviceType">Service Type</Label>
            <Select value={serviceType} onValueChange={(value: ServiceType) => setServiceType(value)} required>
              <SelectTrigger id="serviceType">
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="electricity">Electricity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startTime && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startTime ? format(startTime, "PPP", { locale: fr }) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startTime}
                    onSelect={setStartTime}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="expectedEndTime">Expected End Time (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expectedEndTime && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expectedEndTime ? format(expectedEndTime, "PPP", { locale: fr }) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expectedEndTime}
                    onSelect={setExpectedEndTime}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Reporting...' : 'Report Incident'}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
        </form>
      </CardContent>
    </Card>
  );
};

export default IncidentForm;
