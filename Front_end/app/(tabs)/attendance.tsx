import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Calendar, Search, Filter, ChevronRight, Users } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import { formatDate } from '@/utils/helpers';

// First, add the Session interface at the top of the file
interface Session {
  id: string;
  course_name: string;
  course_type: string;
  session_date: string;
  present: number;  // Changed from present_students
  total: number;    // Changed from total_students
  rate: number;     // Added to match backend
}

export default function ProfessorAttendanceScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    date: '',
    courseType: '',
  });

  // Fetch professor's sessions
  const fetchSessions = async () => {
    try {
      if (user?.id) {
        const response = await api.getProfessorAttendance(user.id);
        if (response.status === 'success') {
          setSessions(response.sessions);
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  }, []);

  const applyFilters = (items: Session[]) => {
    return items.filter(item => {
      const dateMatch = !filters.date || item.session_date.includes(filters.date);
      const typeMatch = !filters.courseType || item.course_type === filters.courseType;
      return dateMatch && typeMatch;
    });
  };

  // Filter sessions based on search and filters
  const filteredSessions = useMemo(() => {
    let items = sessions;

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
  }, [sessions, searchQuery, filters]);

  // Calculate overall statistics
  const totalStudents = sessions.reduce((total, session) => total + session.total, 0);
  const averageRate = Math.round(
    sessions.reduce((total, session) => total + session.rate, 0) / 
    (sessions.length || 1)
  );

  const renderSession = ({ item }: { item: Session }) => (
    <TouchableOpacity style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.courseName}>{item.course_name}</Text>
        <View style={styles.typeTag}>
          <Text style={styles.typeText}>{item.course_type}</Text>
        </View>
      </View>

      <View style={styles.sessionInfo}>
        <View style={styles.infoItem}>
          <Calendar size={16} color="#4F46E5" />
          <Text style={styles.infoText}>{formatDate(item.session_date)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Users size={16} color="#4F46E5" />
          <Text style={styles.infoText}>{item.total} Students</Text>
        </View>
      </View>

      <View style={styles.attendanceBar}>
        <View
          style={[
            styles.attendanceBarFill,
            {
              width: `${item.rate}%`,
              backgroundColor:
                item.rate > 90
                  ? '#10B981'
                  : item.rate > 75
                  ? '#FBBF24'
                  : '#EF4444',
            },
          ]}
        />
      </View>

      <View style={styles.attendanceStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Present</Text>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {item.present}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Absent</Text>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>
            {item.total - item.present}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Rate</Text>
          <Text style={styles.statValue}>{item.rate}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Records</Text>
        <Text style={styles.subtitle}>View and manage class attendance</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by course or date..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsOverview}>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{sessions.length}</Text>
          <Text style={styles.statCardLabel}>Sessions</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{totalStudents}</Text>
          <Text style={styles.statCardLabel}>Students</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{averageRate}%</Text>
          <Text style={styles.statCardLabel}>Avg. Rate</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Sessions</Text>

      <FlatList
        data={filteredSessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sessionList}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter-Regular',
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
  statCardValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#4F46E5',
    marginBottom: 4,
  },
  statCardLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sessionList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sessionCard: {
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
  sessionHeader: {
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
  sessionInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 6,
  },
  attendanceBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  attendanceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#1F2937',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
