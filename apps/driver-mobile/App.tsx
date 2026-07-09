import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { WebView } from 'react-native-webview';

// Office coordinates constant
const OFFICE_LAT = -1.3011758537859464;
const OFFICE_LON = 36.800690681948126;

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
}

interface Order {
  id: string;
  order_number: number;
  status: string;
  total_amount: number;
  shipping_address: {
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    country: string;
    phone: string;
    logistics_type: string;
    calculated_distance_km?: number;
    route_coordinates?: number[][];
    assigned_driver_id?: string;
  };
  items: OrderItem[];
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'dashboard' | 'delivery'>('login');
  const [apiUrl, setApiUrl] = useState('http://localhost:8000'); // Configurable local IP for emulators/devices
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [driverUser, setDriverUser] = useState<any>(null);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'shipped' | 'delivered'>('all');

  // Handle Driver Login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.detail || 'Login failed');
      }

      const { access_token, user } = resJson.data;
      
      // Enforce driver role restriction
      if (user.role !== 'driver' && user.role !== 'admin') {
        throw new Error('Access Denied: Only Rider/Driver accounts can login here.');
      }

      setToken(access_token);
      setDriverUser(user);
      setCurrentScreen('dashboard');
      Alert.alert('Success', `Welcome back, ${user.first_name || 'Driver'}!`);
      
      // Fetch initial orders
      fetchDriverOrders(access_token);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders assigned to driver
  const fetchDriverOrders = async (authToken = token) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/shopping/orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.detail || 'Failed to fetch orders');
      }
      
      // Filter orders where assigned_driver_id matches our driver ID in shipping_address
      const allOrders: Order[] = resJson.data.orders || resJson.data || [];
      const assigned = allOrders.filter(
        (o) => o.shipping_address?.assigned_driver_id === driverUser?.id || driverUser?.role === 'admin'
      );
      setOrders(assigned);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch assigned orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update shipment status (Mark as Picked Up or Delivered)
  const handleUpdateStatus = async (orderId: string, newStatus: 'shipped' | 'delivered') => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/shopping/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.detail || 'Failed to update order status');
      }

      Alert.alert('Status Updated', `Order status set to: ${newStatus.toUpperCase()}`);
      
      // Update selected order in state if active
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
      // Refresh list
      fetchDriverOrders();
    } catch (err: any) {
      Alert.alert('Status Update Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate Leaflet HTML for WebView Map
  const getLeafletHtml = (routeCoords: number[][]) => {
    const routeString = JSON.stringify(routeCoords);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rider Delivery Map</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            height: 100%;
            margin: 0;
            padding: 0;
            background: #f8fafc;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const route = ${routeString};
          
          // Map center
          const map = L.map('map').setView(route[0] || [${OFFICE_LAT}, ${OFFICE_LON}], 13);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          if (route.length > 0) {
            // Office
            L.marker(route[0]).addTo(map).bindPopup('<b>Company Office</b><br/>Start Location').openPopup();
            
            // Vendors
            for (let i = 1; i < route.length - 1; i++) {
              L.marker(route[i]).addTo(map).bindPopup('<b>Vendor Pickup ' + i + '</b><br/>Pickup Item');
            }
            
            // Customer
            if (route.length > 1) {
              L.marker(route[route.length - 1]).addTo(map).bindPopup('<b>Customer Destination</b><br/>Deliver Here');
            }
            
            // Route Polyline
            const polyline = L.polyline(route, {
              color: '#10b981',
              weight: 6,
              opacity: 0.8,
              dashArray: '12, 12'
            }).addTo(map);
            
            map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
          }
        </script>
      </body>
      </html>
    `;
  };

  const handleLogout = () => {
    setToken('');
    setDriverUser(null);
    setOrders([]);
    setCurrentScreen('login');
  };

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    return o.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* 1. LOGIN SCREEN */}
      {currentScreen === 'login' && (
        <View style={styles.loginContainer}>
          <Text style={styles.appTitle}>MyMedDevices</Text>
          <Text style={styles.appSubtitle}>RIDER DELIVERY PORTAL</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>API Server URL</Text>
            <TextInput
              style={styles.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="e.g. http://192.168.1.100:8000"
              autoCapitalize="none"
            />
            
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="rider@mymeddevices.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
            />
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login as Rider</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2. DASHBOARD SCREEN */}
      {currentScreen === 'dashboard' && (
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Rider Dashboard</Text>
              <Text style={styles.headerSubtitle}>{driverUser?.email}</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Filters */}
          <View style={styles.filterBar}>
            {(['all', 'pending', 'shipped', 'delivered'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                  {f.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* List */}
          {loading && orders.length === 0 ? (
            <ActivityIndicator size="large" color="#059669" style={styles.loader} />
          ) : (
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.id}
              refreshing={loading}
              onRefresh={() => fetchDriverOrders()}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No assigned orders found.</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.orderCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.orderNumber}>Order #{item.order_number || item.id.substring(0, 8)}</Text>
                    <Text style={[styles.statusBadge, (styles as any)[`status_${item.status}`] || styles.status_pending]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>

                  <Text style={styles.customerName}>
                    To: {item.shipping_address.first_name} {item.shipping_address.last_name}
                  </Text>
                  <Text style={styles.address}>
                    Addr: {item.shipping_address.address_line1}, {item.shipping_address.city}
                  </Text>

                  {item.shipping_address.calculated_distance_km && (
                    <Text style={styles.distanceText}>
                      Est. Distance: {item.shipping_address.calculated_distance_km} km
                    </Text>
                  )}

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cardButtonOutline}
                      onPress={() => {
                        setSelectedOrder(item);
                        setCurrentScreen('delivery');
                      }}
                    >
                      <Text style={styles.cardButtonOutlineText}>View Route Map</Text>
                    </TouchableOpacity>

                    {item.status === 'paid' && (
                      <TouchableOpacity
                        style={styles.cardButton}
                        onPress={() => handleUpdateStatus(item.id, 'shipped')}
                      >
                        <Text style={styles.cardButtonText}>Mark Picked Up</Text>
                      </TouchableOpacity>
                    )}

                    {item.status === 'shipped' && (
                      <TouchableOpacity
                        style={[styles.cardButton, { backgroundColor: '#059669' }]}
                        onPress={() => handleUpdateStatus(item.id, 'delivered')}
                      >
                        <Text style={styles.cardButtonText}>Mark Delivered</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* 3. ACTIVE DELIVERY/MAP SCREEN */}
      {currentScreen === 'delivery' && selectedOrder && (
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => {
                setSelectedOrder(null);
                setCurrentScreen('dashboard');
              }}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order #{selectedOrder.order_number}</Text>
          </View>

          {/* OSM Map */}
          <View style={styles.mapContainer}>
            <WebView
              originWhitelist={['*']}
              source={{ html: getLeafletHtml(selectedOrder.shipping_address.route_coordinates || [[OFFICE_LAT, OFFICE_LON]]) }}
              style={styles.map}
            />
          </View>

          {/* Delivery Details */}
          <View style={styles.deliveryDetails}>
            <Text style={styles.detailsTitle}>Delivery Details</Text>
            <Text style={styles.detailsText}>
              <Text style={styles.bold}>Customer:</Text> {selectedOrder.shipping_address.first_name} {selectedOrder.shipping_address.last_name}
            </Text>
            <Text style={styles.detailsText}>
              <Text style={styles.bold}>Phone:</Text> {selectedOrder.shipping_address.phone}
            </Text>
            <Text style={styles.detailsText}>
              <Text style={styles.bold}>Destination:</Text> {selectedOrder.shipping_address.address_line1}, {selectedOrder.shipping_address.city}
            </Text>
            <Text style={styles.detailsText}>
              <Text style={styles.bold}>Route Distance:</Text> {selectedOrder.shipping_address.calculated_distance_km || '—'} km
            </Text>

            <View style={styles.detailActions}>
              {selectedOrder.status === 'paid' && (
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => handleUpdateStatus(selectedOrder.id, 'shipped')}
                >
                  <Text style={styles.detailsButtonText}>Confirm Picked Up</Text>
                </TouchableOpacity>
              )}

              {selectedOrder.status === 'shipped' && (
                <TouchableOpacity
                  style={[styles.detailsButton, { backgroundColor: '#059669' }]}
                  onPress={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                >
                  <Text style={styles.detailsButtonText}>Confirm Delivered</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    color: '#0f172a',
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#10b981',
    letterSpacing: 2,
    marginBottom: 40,
  },
  formGroup: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterTabActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 40,
    fontSize: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  status_pending: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  status_paid: {
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
  status_shipped: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
  },
  status_delivered: {
    backgroundColor: '#e0f2fe',
    color: '#0284c7',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 8,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  cardButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  cardButtonOutline: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButtonOutlineText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  deliveryDetails: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  detailsText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  detailActions: {
    marginTop: 18,
  },
  detailsButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
