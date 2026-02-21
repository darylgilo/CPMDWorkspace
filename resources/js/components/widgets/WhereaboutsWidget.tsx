import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Users, UserCheck, UserX, Coffee, Home, Briefcase } from 'lucide-react';

interface Whereabout {
  id: number;
  user_id: number;
  date: string;
  status: 'ON DUTY' | 'ON TRAVEL' | 'ON LEAVE' | 'ABSENT' | 'HALF DAY' | 'WFH';
  reason?: string;
  location?: string;
  user: {
    id: number;
    name: string;
    email: string;
    cpmd: string;
    profile_picture?: string;
  };
}

interface AttendanceStats {
  total: number;
  onDuty: number;
  onTravel: number;
  onLeave: number;
  absent: number;
  halfDay: number;
  wfh: number;
}

interface WhereaboutsWidgetProps {
  className?: string;
}

const WhereaboutsWidget: React.FC<WhereaboutsWidgetProps> = ({ className }) => {
  const [whereabouts, setWhereabouts] = useState<Whereabout[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideInterval, setSlideInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchWhereabouts();
  }, [selectedDate]);

  const itemsPerPage = 4;
  const totalSlides = Math.ceil(whereabouts.length / itemsPerPage);

  useEffect(() => {
    // Reset to first slide when data changes
    setCurrentSlide(0);

    // Auto-slide every 5 seconds
    if (whereabouts.length > itemsPerPage) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }, 10000);
      setSlideInterval(interval);
    }

    return () => {
      if (slideInterval) {
        clearInterval(slideInterval);
      }
    };
  }, [whereabouts.length, totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    if (slideInterval) {
      clearInterval(slideInterval);
    }
    const newInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 10000);
    setSlideInterval(newInterval);
  };

  const nextSlide = () => goToSlide((currentSlide + 1) % totalSlides);
  const prevSlide = () => goToSlide((currentSlide - 1 + totalSlides) % totalSlides);

  const currentWhereabouts = whereabouts.slice(
    currentSlide * itemsPerPage,
    (currentSlide * itemsPerPage) + itemsPerPage
  );

  const fetchWhereabouts = async () => {
    try {
      // Fetch real data from API endpoint
      const response = await fetch(`/api/whereabouts?date=${selectedDate}`);
      const data = await response.json();

      // Extract data from API response
      const whereaboutsData = data.data || [];
      const statsData = data.stats || null;

      setWhereabouts(whereaboutsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching whereabouts:', error);
      // Fallback to empty arrays if API fails
      setWhereabouts([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ON DUTY':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'ABSENT':
        return <UserX className="h-4 w-4 text-red-600" />;
      case 'ON TRAVEL':
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      case 'ON LEAVE':
        return <Coffee className="h-4 w-4 text-purple-600" />;
      case 'HALF DAY':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'WFH':
        return <Home className="h-4 w-4 text-indigo-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ON DUTY':
        return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400';
      case 'ABSENT':
        return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400';
      case 'ON TRAVEL':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400';
      case 'ON LEAVE':
        return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-400';
      case 'HALF DAY':
        return 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-400';
      case 'WFH':
        return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-400';
      default:
        return 'bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ON DUTY':
        return 'On Duty';
      case 'ABSENT':
        return 'Absent';
      case 'ON TRAVEL':
        return 'On Travel';
      case 'ON LEAVE':
        return 'On Leave';
      case 'HALF DAY':
        return 'Half Day';
      case 'WFH':
        return 'WFH';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card className="w-full bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Users className="h-5 w-5 text-[#163832]" />
            Employee Whereabouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#163832]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 shadow-md hover:shadow-lg transition-all duration-200 ${className || ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Users className="h-5 w-5 text-[#163832]" />
            Employee Whereabouts
          </CardTitle>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 border border-gray-300 dark:border-neutral-700 rounded text-xs bg-transparent dark:text-gray-100 focus:outline-none"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="h-7 px-2 text-xs border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              Today
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics Overview */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <div className="text-lg font-bold text-green-600 dark:text-green-500">{stats.onDuty}</div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">On Duty</div>
            </div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-500">{stats.onTravel}</div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">On Travel</div>
            </div>
            <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-500">{stats.onLeave}</div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">On Leave</div>
            </div>
            <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
              <div className="text-lg font-bold text-red-600 dark:text-red-500">{stats.absent}</div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">Absent</div>
            </div>
            <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
              <div className="text-lg font-bold text-orange-600 dark:text-orange-500">{stats.halfDay}</div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">Half Day</div>
            </div>
            <div className="text-center p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded">
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-500">{stats.wfh}</div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">WFH</div>
            </div>
          </div>
        )}

        {/* Employee Carousel */}
        <div className="space-y-1.5 min-h-[210px]">
          {currentWhereabouts.length > 0 ? (
            currentWhereabouts.map(whereabout => (
              <div key={whereabout.id} className="flex items-center justify-between p-2 border border-gray-100 dark:border-neutral-800 rounded-lg bg-gray-50/30 dark:bg-neutral-800/20">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {whereabout.user.profile_picture ? (
                      <img
                        src={`/storage/${whereabout.user.profile_picture}`}
                        alt={whereabout.user.name}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-neutral-700"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    {(!whereabout.user.profile_picture) && (
                      <div className="w-8 h-8 bg-[#163832]/10 dark:bg-[#163832]/20 rounded-full flex items-center justify-center border border-[#163832]/20">
                        <span className="text-[10px] font-bold text-[#163832] dark:text-[#DAF1DE]">
                          {whereabout.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-semibold text-xs dark:text-gray-200 truncate max-w-[120px]">{whereabout.user.name}</div>
                    {whereabout.location && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 truncate">
                        <MapPin className="h-2.5 w-2.5" />
                        {whereabout.location}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <Badge className={`text-[10px] font-normal px-2 py-0 ${getStatusColor(whereabout.status)} border-none shadow-none`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(whereabout.status)}
                      {getStatusLabel(whereabout.status)}
                    </div>
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Users className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-xs">No records for this date</p>
            </div>
          )}
        </div>

        {/* Carousel Controls */}
        {totalSlides > 1 && (
          <div className="flex items-center justify-between mt-3 px-1">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              className="h-6 w-6 p-0 rounded-full border-gray-200 dark:border-neutral-800"
            >
              ←
            </Button>

            <div className="flex gap-1.5">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${index === currentSlide
                    ? 'bg-[#163832] w-3'
                    : 'bg-gray-300 dark:bg-neutral-700 hover:bg-gray-400'
                    }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              className="h-6 w-6 p-0 rounded-full border-gray-200 dark:border-neutral-800"
            >
              →
            </Button>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-neutral-800">
          <div className="grid grid-cols-3 gap-y-2 text-[10px] text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span>On Duty</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>On Travel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              <span>On Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
              <span>Half Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
              <span>WFH</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhereaboutsWidget;
