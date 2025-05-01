import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Search, Filter, Calendar, CheckCircle, XCircle } from 'lucide-react-native';
import { formatDate } from '@/utils/helpers';
import { useAuth } from '@/context/AuthContext';
import { useRefresh } from '@/context/RefreshContext';
import { api } from '@/utils/api';

// Add interface for attendance records
interface AttendanceRecord {
  id: string;
  course_name: string;
  course_type: string;
  session_date: string; // Changed from 'date'
  status: 'present' | 'absent';
  professor_name: string;
}

const SCAN_COOLDOWN = 5000; // 5 seconds cooldown

export default function StudentAttendanceScreen() {
  const { user } = useAuth();
  const { triggerRefresh } = useRefresh();
  const [searchQuery, setSearchQuery] = useState('');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    date: '',
    courseType: '',
  });
  const [canScan, setCanScan] = useState(true);
  const [cooldownTime, setCooldownTime] = useState(0);
  const cooldownTimer = useRef<NodeJS.Timeout | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanSuccess, setScanSuccess] = useState<boolean | null>(null);
  const [scanMessage, setScanMessage] = useState('');

  const fetchAttendance = async () => {
    try {
      if (user?.id) {
        const response = await api.getStudentAttendance(user.id);
        if (response.status === 'success') {
          setAttendance(response.attendance);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch attendance data
  useEffect(() => {
    fetchAttendance();
  }, [user]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimer.current) {
        clearInterval(cooldownTimer.current);
      }
      setCanScan(true);
      setCooldownTime(0);
      setScanSuccess(null);
      setScanMessage('');
    };
  }, []);

  // Calculate statistics from real data
  const totalClasses = attendance.length;
  const presentClasses = attendance.filter(record => record.status === 'present').length;
  const attendanceRate = Math.round((presentClasses / totalClasses) * 100) || 0;

  const applyFilters = (items: AttendanceRecord[]) => {
    return items.filter(item => {
      const dateMatch = !filters.date || item.session_date.includes(filters.date);
      const typeMatch = !filters.courseType || item.course_type === filters.courseType;
      return dateMatch && typeMatch;
    });
  };

  const filteredAttendance = useMemo(() => {
    let items = attendance;

    // Apply search
    if (searchQuery.trim()) {
      items = items.filter(item =>
        item.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.course_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.session_date.includes(searchQuery)
      );
    }

    // Apply filters
    return applyFilters(items);
  }, [attendance, searchQuery, filters]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const startCooldown = () => {
    setCanScan(false);
    setCooldownTime(SCAN_COOLDOWN / 1000);

    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current);
    }

    cooldownTimer.current = setInterval(() => {
      setCooldownTime(prev => {
        if (prev <= 1) {
          if (cooldownTimer.current) {
            clearInterval(cooldownTimer.current);
          }
          setCanScan(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!canScan) {
      Alert.alert('Please wait', `You can scan again in ${cooldownTime} seconds`);
      return;
    }

    try {
      startCooldown(); // Start cooldown immediately
      const response = await api.markAttendance({
        qr_code_data: data,
        student_id: user!.id
      });

      if (response.status === 'success') {
        setScanSuccess(true);
        setScanMessage('Successfully marked attendance');
        setIsCameraActive(false);
        // Refresh data after successful scan
        await fetchAttendance();
        triggerRefresh(); // Trigger refresh for other components
      } else {
        setScanSuccess(false);
        setScanMessage(response.message || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setScanSuccess(false);
      setScanMessage(error instanceof Error ? error.message : 'Failed to mark attendance');
    } finally {
      setIsCameraActive(false);
    }
  };

  const renderCooldownStatus = () => {
    if (!canScan && cooldownTime > 0) {
      return (
        <View style={styles.cooldownContainer}>
          <Text style={styles.cooldownText}>
            Next scan available in {cooldownTime}s
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderAttendanceRecord = ({ item }: { item: AttendanceRecord }) => (
    <View style={styles.attendanceCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.courseName}>{item.course_name}</Text>
        <View
          style={[
            styles.statusTag,
            {
              backgroundColor: item.status === 'present' ? '#D1FAE5' : '#FEE2E2',
            },
          ]}
        >
          {item.status === 'present' ? (
            <CheckCircle size={16} color="#10B981" />
          ) : (
            <XCircle size={16} color="#EF4444" />
          )}
          <Text
            style={[
              styles.statusText,
              {
                color: item.status === 'present' ? '#10B981' : '#EF4444',
              },
            ]}
          >
            {item.status === 'present' ? 'Present' : 'Absent'}
          </Text>
        </View>
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.infoText}>{formatDate(item.session_date)}</Text>
        </View>
        <View style={styles.typeTag}>
          <Text style={styles.typeText}>{item.course_type}</Text>
        </View>
      </View>
      <View style={styles.professorInfo}>
        <Text style={styles.professorLabel}>Professor:</Text>
        <Text style={styles.professorName}>{item.professor_name}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  if (!attendance.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No attendance records found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Attendance</Text>
        <Text style={styles.subtitle}>Track your class attendance</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {renderCooldownStatus()}

      <View style={styles.statsOverview}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalClasses}</Text>
          <Text style={styles.statLabel}>Total Classes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{presentClasses}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{attendanceRate}%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
      </View>

      <FlatList
        data={filteredAttendance}
        renderItem={renderAttendanceRecord}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: -24,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statsOverview: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  statValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  list: {
    padding: 24,
  },
  attendanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginLeft: 4,
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 6,
  },
  typeTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  typeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#4F46E5',
  },
  professorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  professorLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  professorName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#1F2937',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  cooldownContainer: {
    backgroundColor: '#EEF2FF',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  cooldownText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#4F46E5',
    textAlign: 'center',
  },
});