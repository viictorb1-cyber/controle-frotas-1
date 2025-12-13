import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationTracking } from '@/hooks/use-location-tracking';

// Placa do veículo - Altere conforme necessário
const VEHICLE_LICENSE_PLATE = 'APP-MOBILE-001';

export default function TrackingScreen() {
  const {
    isTracking,
    permissionStatus,
    lastLocation,
    lastApiResponse,
    error,
    sendCount,
    isLoading,
    startTracking,
    stopTracking,
    requestPermission,
    clearError,
  } = useLocationTracking(VEHICLE_LICENSE_PLATE);

  // Formatar timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Status da permissão formatado
  const getPermissionStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return { text: 'Concedida', color: '#10b981' };
      case 'denied':
        return { text: 'Negada', color: '#ef4444' };
      case 'checking':
        return { text: 'Verificando...', color: '#f59e0b' };
      default:
        return { text: 'Não verificado', color: '#6b7280' };
    }
  };

  const permissionInfo = getPermissionStatusText();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="car-sport" size={48} color="#00d4ff" />
        <Text style={styles.title}>Controle de Frotas</Text>
        <Text style={styles.subtitle}>Rastreamento GPS em Tempo Real</Text>
      </View>

      {/* Card de Status */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="radio" size={24} color="#00d4ff" />
          <Text style={styles.cardTitle}>Status do Rastreamento</Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Status:</Text>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isTracking ? '#10b981' : '#6b7280' },
              ]}
            />
            <Text style={[styles.statusText, { color: isTracking ? '#10b981' : '#6b7280' }]}>
              {isTracking ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Permissão:</Text>
          <Text style={[styles.value, { color: permissionInfo.color }]}>
            {permissionInfo.text}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Veículo:</Text>
          <Text style={styles.value}>{VEHICLE_LICENSE_PLATE}</Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Envios realizados:</Text>
          <Text style={styles.valueHighlight}>{sendCount}</Text>
        </View>

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#00d4ff" />
            <Text style={styles.loadingText}>Obtendo localização...</Text>
          </View>
        )}
      </View>

      {/* Card de Localização */}
      {lastLocation && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="navigate" size={24} color="#10b981" />
            <Text style={styles.cardTitle}>Última Localização</Text>
          </View>

          <View style={styles.locationGrid}>
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>Latitude</Text>
              <Text style={styles.locationValue}>{lastLocation.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>Longitude</Text>
              <Text style={styles.locationValue}>{lastLocation.longitude.toFixed(6)}</Text>
            </View>
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>Velocidade</Text>
              <Text style={styles.locationValue}>{lastLocation.speed} km/h</Text>
            </View>
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>Horário</Text>
              <Text style={styles.locationValue}>{formatTime(lastLocation.timestamp)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Card de Resposta da API */}
      {lastApiResponse && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cloud-done" size={24} color="#8b5cf6" />
            <Text style={styles.cardTitle}>Resposta da API</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.label}>Ação:</Text>
            <Text style={[styles.value, { color: lastApiResponse.action === 'created' ? '#10b981' : '#00d4ff' }]}>
              {lastApiResponse.action === 'created' ? 'Veículo Criado' : 'Atualizado'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.label}>Status do Veículo:</Text>
            <Text style={styles.value}>{lastApiResponse.vehicle.status}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.label}>Ignição:</Text>
            <Text style={[styles.value, { color: lastApiResponse.vehicle.ignition === 'on' ? '#10b981' : '#ef4444' }]}>
              {lastApiResponse.vehicle.ignition === 'on' ? 'Ligada' : 'Desligada'}
            </Text>
          </View>
        </View>
      )}

      {/* Card de Erro */}
      {error && (
        <View style={[styles.card, styles.errorCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
            <Text style={[styles.cardTitle, { color: '#ef4444' }]}>Erro</Text>
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.dismissButton} onPress={clearError}>
            <Text style={styles.dismissButtonText}>Dispensar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Botões de Controle */}
      <View style={styles.buttonContainer}>
        {permissionStatus === 'denied' && (
          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={requestPermission}
          >
            <Ionicons name="key" size={24} color="#fff" />
            <Text style={styles.buttonText}>Solicitar Permissão Novamente</Text>
          </TouchableOpacity>
        )}

        {!isTracking ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={startTracking}
          >
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.buttonText}>Iniciar Rastreamento</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopTracking}
          >
            <Ionicons name="stop" size={24} color="#fff" />
            <Text style={styles.buttonText}>Parar Rastreamento</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Informações Adicionais */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#6b7280" />
        <Text style={styles.infoText}>
          O rastreamento envia sua localização a cada 5 segundos para o servidor.
          Mantenha o GPS ativado para maior precisão.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  label: {
    fontSize: 14,
    color: '#9ca3af',
  },
  value: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  valueHighlight: {
    fontSize: 18,
    color: '#00d4ff',
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2d3748',
  },
  loadingText: {
    color: '#00d4ff',
    fontSize: 14,
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  locationItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  errorCard: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    lineHeight: 20,
  },
  dismissButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  dismissButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButton: {
    backgroundColor: '#10b981',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  warningButton: {
    backgroundColor: '#f59e0b',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
  },
});

