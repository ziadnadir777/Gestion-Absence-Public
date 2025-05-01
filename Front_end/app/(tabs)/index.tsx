import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import QRCode from 'react-native-qrcode-svg';
import { Save, Calendar, Book, Check } from 'lucide-react-native';
import { generateUniqueId } from '@/utils/helpers';
import { api } from '@/utils/api';

// Course type options
const COURSE_TYPES = [
  'Lecture',
  'Lab',
  'Tutorial',
  'Workshop',
  'Seminar',
];

export default function QRCodeGeneratorScreen() {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [courseType, setCourseType] = useState('');
  const [courseName, setCourseName] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [qrGenerated, setQrGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Generate QR code value
  const generateQRCode = async () => {
    if (!date || !courseType || !courseName) {
      Alert.alert('Missing Information', 'Please fill in all the required fields.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.generateQR({
        session_date: date,
        course_name: courseName,
        course_type: courseType,
        professor_id: user?.id || 0
      });

      if (response.status === 'success') {
        setQrValue(response.qr_code_data);
        setQrGenerated(true);
        
        // Trigger animations
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Alert.alert('Error', response.message || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error generating QR:', error);
      Alert.alert('Error', 'Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Reset animation values when QR is regenerated
  useEffect(() => {
    if (!qrGenerated) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [qrGenerated]);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Generate Attendance QR Code</Text>
        <Text style={styles.subtitle}>Create a unique QR code for your class session</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Calendar size={16} color="#4F46E5" /> Session Date
            </Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={date}
              onChangeText={setDate}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Book size={16} color="#4F46E5" /> Course Name
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Computer Science 101"
              value={courseName}
              onChangeText={setCourseName}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Course Type</Text>
            <View style={styles.typeContainer}>
              {COURSE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    courseType === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setCourseType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      courseType === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                  {courseType === type && (
                    <Check size={14} color="#fff" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={generateQRCode}
            disabled={isGenerating}
          >
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generating...' : 'Generate QR Code'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {qrGenerated && (
          <Animated.View
            style={[
              styles.qrContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={styles.qrTitle}>Scan to Mark Attendance</Text>
            <View style={styles.qrCode}>
              <QRCode
                value={qrValue}
                size={200}
                color="#000"
                backgroundColor="#fff"
              />
            </View>
            <View style={styles.qrInfo}>
              <Text style={styles.qrInfoLabel}>Course:</Text>
              <Text style={styles.qrInfoValue}>{courseName}</Text>
              
              <Text style={styles.qrInfoLabel}>Type:</Text>
              <Text style={styles.qrInfoValue}>{courseType}</Text>
              
              <Text style={styles.qrInfoLabel}>Date:</Text>
              <Text style={styles.qrInfoValue}>{date}</Text>
            </View>
            
            <TouchableOpacity style={styles.saveButton}>
              <Save size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save QR Code</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 24,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  typeButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#4F46E5',
  },
  typeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#4B5563',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  checkIcon: {
    marginLeft: 4,
  },
  generateButton: {
    backgroundColor: '#4F46E5',
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  qrContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
    marginBottom: 24,
  },
  qrCode: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  qrInfo: {
    width: '100%',
    marginBottom: 24,
  },
  qrInfoLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  qrInfoValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  saveButtonText: {
    color: '#fff',
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginLeft: 8,
  },
});