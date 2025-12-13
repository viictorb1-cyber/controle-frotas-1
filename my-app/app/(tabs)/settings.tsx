import { StyleSheet, Text, View, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTrackingApiUrl, testServerConnection } from '@/lib/tracking-service';
import { useState } from 'react';

export default function SettingsScreen() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const apiUrl = getTrackingApiUrl();

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    const isConnected = await testServerConnection();
    setConnectionStatus(isConnected ? 'success' : 'error');
  };

  const handleOpenDocs = () => {
    // Em uma implementação real, isso poderia abrir uma URL
    console.log('Abrir documentação');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="settings" size={48} color="#00d4ff" />
        <Text style={styles.title}>Configurações</Text>
      </View>

      {/* Card de Configuração da API */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="server" size={24} color="#8b5cf6" />
          <Text style={styles.cardTitle}>Servidor de Rastreamento</Text>
        </View>

        <View style={styles.configItem}>
          <Text style={styles.label}>URL da API:</Text>
          <Text style={styles.valueCode}>{apiUrl}</Text>
        </View>

        <View style={styles.configItem}>
          <Text style={styles.label}>Endpoint:</Text>
          <Text style={styles.valueCode}>/api/tracking</Text>
        </View>

        <View style={styles.configItem}>
          <Text style={styles.label}>Intervalo de Envio:</Text>
          <Text style={styles.value}>5 segundos</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.testButton,
            connectionStatus === 'testing' && styles.testButtonLoading,
            connectionStatus === 'success' && styles.testButtonSuccess,
            connectionStatus === 'error' && styles.testButtonError,
          ]}
          onPress={handleTestConnection}
          disabled={connectionStatus === 'testing'}
        >
          {connectionStatus === 'testing' ? (
            <Ionicons name="hourglass" size={20} color="#fff" />
          ) : connectionStatus === 'success' ? (
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
          ) : connectionStatus === 'error' ? (
            <Ionicons name="close-circle" size={20} color="#fff" />
          ) : (
            <Ionicons name="flash" size={20} color="#fff" />
          )}
          <Text style={styles.testButtonText}>
            {connectionStatus === 'testing'
              ? 'Testando...'
              : connectionStatus === 'success'
              ? 'Conectado!'
              : connectionStatus === 'error'
              ? 'Falha na Conexão'
              : 'Testar Conexão'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Card de Informações do App */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle" size={24} color="#00d4ff" />
          <Text style={styles.cardTitle}>Sobre o Aplicativo</Text>
        </View>

        <View style={styles.configItem}>
          <Text style={styles.label}>Versão:</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>

        <View style={styles.configItem}>
          <Text style={styles.label}>Plataforma:</Text>
          <Text style={styles.value}>React Native / Expo</Text>
        </View>
      </View>

      {/* Card de Requisitos */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="list" size={24} color="#f59e0b" />
          <Text style={styles.cardTitle}>Requisitos</Text>
        </View>

        <View style={styles.requirementItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.requirementText}>Permissão de localização habilitada</Text>
        </View>

        <View style={styles.requirementItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.requirementText}>GPS ativado no dispositivo</Text>
        </View>

        <View style={styles.requirementItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.requirementText}>Conexão com a mesma rede do servidor</Text>
        </View>

        <View style={styles.requirementItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.requirementText}>Servidor de rastreamento em execução</Text>
        </View>
      </View>

      {/* Card de Ajuda */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="help-circle" size={24} color="#10b981" />
          <Text style={styles.cardTitle}>Precisa de Ajuda?</Text>
        </View>

        <Text style={styles.helpText}>
          Certifique-se de que:{'\n\n'}
          • O servidor está rodando em {apiUrl}{'\n'}
          • Seu dispositivo está na mesma rede Wi-Fi{'\n'}
          • A porta 5000 está liberada no firewall{'\n'}
          • A permissão de localização foi concedida
        </Text>

        <TouchableOpacity style={styles.helpButton} onPress={handleOpenDocs}>
          <Ionicons name="document-text" size={20} color="#00d4ff" />
          <Text style={styles.helpButtonText}>Ver Documentação</Text>
        </TouchableOpacity>
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
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
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
  valueCode: {
    fontSize: 12,
    color: '#00d4ff',
    fontFamily: 'monospace',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  testButtonLoading: {
    backgroundColor: '#6b7280',
  },
  testButtonSuccess: {
    backgroundColor: '#10b981',
  },
  testButtonError: {
    backgroundColor: '#ef4444',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#d1d5db',
    flex: 1,
  },
  helpText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#00d4ff',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  helpButtonText: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: '600',
  },
});

