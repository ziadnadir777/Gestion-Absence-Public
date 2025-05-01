import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRefresh } from '@/context/RefreshContext';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, QrCode, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { api } from '@/utils/api'; // Assuming api is imported from a relevant module

export default function StudentScanScreen() {
  const { user } = useAuth();
  const { triggerRefresh } = useRefresh();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanSuccess, setScanSuccess] = useState<boolean | null>(null);
  const [scanMessage, setScanMessage] = useState('');
  
  // Animation refs
  const scanStatusOpacity = useRef(new Animated.Value(0)).current;
  const scanStatusScale = useRef(new Animated.Value(0.8)).current;
  
  // Handle QR code scanned
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    try {
      const response = await api.markAttendance({
        qr_code_data: data,
        student_id: user!.id
      });

      if (response.status === 'success') {
        setScanSuccess(true);
        setScanMessage('Successfully marked attendance');
        setIsCameraActive(false);
        triggerRefresh(); // Trigger refresh after successful attendance
        
        // Animate success message
        Animated.parallel([
          Animated.timing(scanStatusOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(scanStatusScale, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        throw new Error(response.message || 'Invalid QR Code');
      }
    } catch (error) {
      setScanSuccess(false);
      setScanMessage(error instanceof Error ? error.message : 'Failed to mark attendance');
      setIsCameraActive(false);
      
      // Animate error message
      Animated.parallel([
        Animated.timing(scanStatusOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scanStatusScale, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };
  
  // Reset scan state
  const resetScan = () => {
    setScanSuccess(null);
    setScanMessage('');
    
    // Reset animations
    scanStatusOpacity.setValue(0);
    scanStatusScale.setValue(0.8);
  };
  
  // Start scanning
  const startScanning = async () => {
    if (!permission?.granted) {
      const permissionResult = await requestPermission();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to scan QR codes'
        );
        return;
      }
    }
    
    resetScan();
    setIsCameraActive(true);
  };
  
  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.centered}>
        <Text>Loading camera permissions...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Attendance QR</Text>
        <Text style={styles.subtitle}>Scan your professor's QR code to mark your attendance</Text>
      </View>
      
      <View style={styles.content}>
        {isCameraActive ? (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            >
              <View style={styles.overlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanText}>
                  Position the QR code within the frame
                </Text>
              </View>
            </CameraView>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsCameraActive(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.scanContainer}>
            {scanSuccess === null ? (
              <>
                <View style={styles.iconContainer}>
                  <QrCode size={80} color="#4F46E5" />
                </View>
                
                <Text style={styles.scanPrompt}>
                  Tap the button below to scan your professor's QR code and mark your attendance for the class.
                </Text>
                
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={startScanning}
                >
                  <Camera size={24} color="#fff" />
                  <Text style={styles.scanButtonText}>Scan QR Code</Text>
                </TouchableOpacity>
                
                <View style={styles.statusBox}>
                  <Text style={styles.studentInfo}>
                    Logged in as: <Text style={styles.studentName}>{user?.full_name}</Text>
                  </Text>
                  <Text style={styles.studentId}>ID: {user?.id}</Text>
                </View>
              </>
            ) : (
              <Animated.View
                style={[
                  styles.resultContainer,
                  {
                    opacity: scanStatusOpacity,
                    transform: [{ scale: scanStatusScale }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.resultIconContainer,
                    {
                      backgroundColor: scanSuccess
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                    },
                  ]}
                >
                  {scanSuccess ? (
                    <CheckCircle size={60} color="#10B981" />
                  ) : (
                    <AlertTriangle size={60} color="#EF4444" />
                  )}
                </View>
                
                <Text
                  style={[
                    styles.resultTitle,
                    {
                      color: scanSuccess ? '#10B981' : '#EF4444',
                    },
                  ]}
                >
                  {scanSuccess ? 'Success!' : 'Scan Failed'}
                </Text>
                
                <Text style={styles.resultMessage}>{scanMessage}</Text>
                
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: scanSuccess ? '#10B981' : '#4F46E5',
                    },
                  ]}
                  onPress={scanSuccess ? resetScan : startScanning}
                >
                  <Text style={styles.actionButtonText}>
                    {scanSuccess ? 'Done' : 'Try Again'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        )}
      </View>
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
  content: {
    flex: 1,
    padding: 24,
  },
  scanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  scanPrompt: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 32,
    width: '100%',
  },
  scanButtonText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginLeft: 8,
  },
  statusBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  studentInfo: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  studentName: {
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  studentId: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 24,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
  },
  scanText: {
    color: '#fff',
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  resultContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    marginBottom: 16,
  },
  resultMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  actionButtonText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});