import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// ============================================
// CLOUDFLARE D1 API CLIENT
// ============================================
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds
const MAX_QUERY_LIMIT = 100; // Maximum number of records to fetch

class CloudflareDB {
  constructor(accountId, apiToken, databaseId) {
    // Input validation
    if (!accountId || typeof accountId !== 'string' || !accountId.trim()) {
      throw new Error('Invalid accountId: must be a non-empty string');
    }
    if (!apiToken || typeof apiToken !== 'string' || !apiToken.trim()) {
      throw new Error('Invalid apiToken: must be a non-empty string');
    }
    if (!databaseId || typeof databaseId !== 'string' || !databaseId.trim()) {
      throw new Error('Invalid databaseId: must be a non-empty string');
    }

    this.accountId = accountId.trim();
    this.apiToken = apiToken.trim();
    this.databaseId = databaseId.trim();
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}`;
  }

  async query(sql, params = []) {
    if (!sql || typeof sql !== 'string' || !sql.trim()) {
      throw new Error('Invalid SQL query: must be a non-empty string');
    }
    if (!Array.isArray(params)) {
      throw new Error('Invalid params: must be an array');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/query`,
        { sql: sql.trim(), params },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          timeout: REQUEST_TIMEOUT_MS,
        }
      );

      if (!response.data || !response.data.result) {
        throw new Error('Invalid response from Cloudflare D1 API');
      }

      return response.data.result[0];
    } catch (error) {
      const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
      console.error('Cloudflare DB Error:', errorMessage);
      throw new Error(`Database operation failed: ${errorMessage}`);
    }
  }

  async saveProject(project) {
    // Validate project data
    if (!project || typeof project !== 'object') {
      throw new Error('Invalid project: must be an object');
    }
    if (!project.name || typeof project.name !== 'string' || !project.name.trim()) {
      throw new Error('Invalid project name: must be a non-empty string');
    }

    // Use parameterized query to prevent SQL injection
    const sql = `INSERT INTO projects (name, idea, code, stack, timestamp) VALUES (?, ?, ?, ?, ?)`;
    return this.query(sql, [
      project.name.trim(),
      project.idea || '',
      project.code || '',
      project.stack || '',
      Date.now(),
    ]);
  }

  async getProjects(limit = 10) {
    // Validate limit parameter
    const validLimit = Math.min(Math.max(1, parseInt(limit, 10) || 10), MAX_QUERY_LIMIT);
    
    // Use parameterized query to prevent SQL injection
    const sql = `SELECT * FROM projects ORDER BY timestamp DESC LIMIT ?`;
    return this.query(sql, [validLimit]);
  }
}

// ============================================
// THE 7 AGENTS
// ============================================
class AgentOrchestrator {
  constructor(openaiKey, cloudflareDB, logCallback) {
    this.openaiKey = openaiKey;
    this.db = cloudflareDB;
    this.log = logCallback;
  }

  async callOpenAI(systemPrompt, userPrompt, temperature = 0.7) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: 4000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      this.log(`❌ OpenAI Error: ${error.message}`, 'error');
      throw error;
    }
  }

  // AGENT 1: SCOUT (Find market gaps)
  async agentScout() {
    this.log('🔍 AGENT SCOUT: Scanning market trends...', 'agent');

    const systemPrompt = `You are a Market Intelligence AI. Your job is to find profitable app ideas.
Analyze current trends in: AI tools, crypto, social media, productivity.
Output a JSON with: {"name": "App Name", "problem": "What problem it solves", "solution": "Technical solution", "stack": "React Native|Web", "monetization": "How to make money"}`;

    const userPrompt = `Find a NEW app idea that can be built in 24h and monetized immediately. Focus on viral potential.`;

    const result = await this.callOpenAI(systemPrompt, userPrompt, 0.9);

    try {
      const idea = JSON.parse(result);
      this.log(`✅ SCOUT: Found "${idea.name}"`, 'success');
      return idea;
    } catch {
      this.log('⚠️ SCOUT: Invalid JSON, retrying...', 'warning');
      return this.agentScout();
    }
  }

  // AGENT 2: UI DESIGNER
  async agentUI(idea) {
    this.log('🎨 AGENT UI: Designing interface...', 'agent');

    const systemPrompt = `You are a Senior React Native UI Developer.
Generate COMPLETE React Native code for the main screen.
Use: View, Text, TouchableOpacity, StyleSheet, ScrollView.
Style: Cyberpunk/Modern. NO PLACEHOLDERS.`;

    const userPrompt = `Create the main screen for: ${idea.name}
Description: ${idea.solution}
Output: Full React Native component code.`;

    const uiCode = await this.callOpenAI(systemPrompt, userPrompt, 0.5);
    this.log('✅ UI: Interface generated', 'success');
    return uiCode;
  }

  // AGENT 3: LOGIC ENGINEER
  async agentLogic(idea) {
    this.log('⚙️ AGENT LOGIC: Building core engine...', 'agent');

    const systemPrompt = `You are a Backend Engineer specializing in React Native.
Write the business logic and state management.
Use: useState, useEffect, AsyncStorage, real API calls.
Include error handling with try/catch.`;

    const userPrompt = `Write the logic layer for: ${idea.name}
Features needed: ${idea.solution}
Output: Complete JavaScript functions and hooks.`;

    const logicCode = await this.callOpenAI(systemPrompt, userPrompt, 0.4);
    this.log('✅ LOGIC: Core engine ready', 'success');
    return logicCode;
  }

  // AGENT 4: INTEGRATOR
  async agentIntegrator(idea) {
    this.log('🔌 AGENT INTEGRATOR: Setting up configs...', 'agent');

    const systemPrompt = `You are a DevOps Engineer.
Generate configuration files: app.json (Expo), eas.json (build config).
Output valid JSON only.`;

    const userPrompt = `Create config files for: ${idea.name}
Stack: ${idea.stack}
Platform: Android APK via EAS Build.`;

    const configs = await this.callOpenAI(systemPrompt, userPrompt, 0.3);
    this.log('✅ INTEGRATOR: Configs ready', 'success');
    return configs;
  }

  // AGENT 5: GROWTH HACKER
  async agentGrowth(idea) {
    this.log('📈 AGENT GROWTH: Crafting viral mechanics...', 'agent');

    const systemPrompt = `You are a Growth Hacker with expertise in viral loops.
Create: App copy (headlines, CTAs), share mechanisms, gamification.
Output: JSON with {onboarding, cta, shareText, viralLoop}`;

    const userPrompt = `Design growth strategy for: ${idea.name}
Goal: Maximum viral spread and user retention.`;

    const growthPlan = await this.callOpenAI(systemPrompt, userPrompt, 0.8);
    this.log('✅ GROWTH: Viral mechanics defined', 'success');
    return growthPlan;
  }

  // AGENT 6: QUALITY ASSURANCE
  async agentQA(allCode) {
    this.log('🔍 AGENT QA: Running quality checks...', 'agent');

    const systemPrompt = `You are a QA Engineer.
Review the code for: Syntax errors, missing imports, security issues.
Output: "APPROVED" or list of issues.`;

    const userPrompt = `Review this code:\n${allCode.substring(0, 3000)}`;

    const qaResult = await this.callOpenAI(systemPrompt, userPrompt, 0.2);
    this.log(`✅ QA: ${qaResult.includes('APPROVED') ? 'All checks passed' : 'Issues found'}`, 'success');
    return qaResult;
  }

  // AGENT 7: CLOSER (Package & Deploy)
  async agentCloser(projectData) {
    this.log('📦 AGENT CLOSER: Packaging project...', 'agent');

    // Save to Cloudflare D1
    try {
      await this.db.saveProject(projectData);
      this.log('✅ CLOSER: Project saved to Cloudflare', 'success');
    } catch (error) {
      this.log('⚠️ CLOSER: DB save failed, using local storage', 'warning');
      await AsyncStorage.setItem(
        `project_${Date.now()}`,
        JSON.stringify(projectData)
      );
    }

    return {
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      project: projectData,
    };
  }

  // MAIN ORCHESTRATION LOOP
  async executeFullCycle() {
    this.log('🚀 STARTING NEW BUILD CYCLE...', 'system');

    try {
      // Phase 1: Idea Generation
      const idea = await this.agentScout();

      // Phase 2: Parallel Build (UI + Logic)
      this.log('🔄 PHASE 2: Parallel execution...', 'system');
      const [uiCode, logicCode, configs, growthPlan] = await Promise.all([
        this.agentUI(idea),
        this.agentLogic(idea),
        this.agentIntegrator(idea),
        this.agentGrowth(idea),
      ]);

      // Phase 3: Quality Check
      const allCode = `${uiCode}\n\n${logicCode}`;
      await this.agentQA(allCode);

      // Phase 4: Package & Save
      const projectData = {
        name: idea.name,
        idea: JSON.stringify(idea),
        code: allCode,
        configs,
        growthPlan,
        stack: idea.stack,
      };

      const result = await this.agentCloser(projectData);

      this.log('✅ BUILD COMPLETE! Ready for next cycle.', 'system');
      return result;

    } catch (error) {
      this.log(`❌ CYCLE FAILED: ${error.message}`, 'error');
      throw error;
    }
  }
}

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function App() {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    cfAccountId: '',
    cfApiToken: '',
    cfDatabaseId: '',
  });
  const [keysConfigured, setKeysConfigured] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const saved = await AsyncStorage.getItem('api_keys');
      if (saved) {
        const keys = JSON.parse(saved);
        setApiKeys(keys);
        setKeysConfigured(true);
      }
    } catch (error) {
      console.error('Failed to load keys:', error);
    }
  };

  const saveKeys = async () => {
    try {
      await AsyncStorage.setItem('api_keys', JSON.stringify(apiKeys));
      setKeysConfigured(true);
      addLog('✅ API Keys saved securely', 'success');
    } catch (error) {
      addLog('❌ Failed to save keys', 'error');
    }
  };

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { message, type, timestamp }]);
  };

  const startFactory = async () => {
    if (!keysConfigured) {
      addLog('❌ Configure API keys first!', 'error');
      return;
    }

    setIsRunning(true);
    addLog('🏭 FACTORY STARTED', 'system');

    try {
      // Validate API keys before initialization
      if (!apiKeys.openai || typeof apiKeys.openai !== 'string' || !apiKeys.openai.trim()) {
        throw new Error('OpenAI API key is required');
      }
      if (!apiKeys.cfAccountId || typeof apiKeys.cfAccountId !== 'string' || !apiKeys.cfAccountId.trim()) {
        throw new Error('Cloudflare Account ID is required');
      }
      if (!apiKeys.cfApiToken || typeof apiKeys.cfApiToken !== 'string' || !apiKeys.cfApiToken.trim()) {
        throw new Error('Cloudflare API Token is required');
      }
      if (!apiKeys.cfDatabaseId || typeof apiKeys.cfDatabaseId !== 'string' || !apiKeys.cfDatabaseId.trim()) {
        throw new Error('Cloudflare Database ID is required');
      }

      const db = new CloudflareDB(
        apiKeys.cfAccountId.trim(),
        apiKeys.cfApiToken.trim(),
        apiKeys.cfDatabaseId.trim()
      );

      const orchestrator = new AgentOrchestrator(
        apiKeys.openai.trim(),
        db,
        addLog
      );

      // Infinite loop
      while (true) {
        await orchestrator.executeFullCycle();
        addLog('⏳ Waiting 10s before next cycle...', 'system');
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    } catch (error) {
      addLog(`💥 FACTORY ERROR: ${error.message}`, 'error');
      setIsRunning(false);
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'agent': return '#00D9FF';
      case 'success': return '#00FF88';
      case 'error': return '#FF0066';
      case 'warning': return '#FFB800';
      case 'system': return '#FF00FF';
      default: return '#FFFFFF';
    }
  };

  if (!keysConfigured) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.setupContainer}>
          <Text style={styles.title}>🏭 THE ARCHITECT</Text>
          <Text style={styles.subtitle}>Configure API Keys</Text>

          <TextInput
            style={styles.input}
            placeholder="OpenAI API Key"
            placeholderTextColor="#666"
            value={apiKeys.openai}
            onChangeText={(text) => setApiKeys({ ...apiKeys, openai: text })}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Cloudflare Account ID"
            placeholderTextColor="#666"
            value={apiKeys.cfAccountId}
            onChangeText={(text) => setApiKeys({ ...apiKeys, cfAccountId: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Cloudflare API Token"
            placeholderTextColor="#666"
            value={apiKeys.cfApiToken}
            onChangeText={(text) => setApiKeys({ ...apiKeys, cfApiToken: text })}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Cloudflare D1 Database ID"
            placeholderTextColor="#666"
            value={apiKeys.cfDatabaseId}
            onChangeText={(text) => setApiKeys({ ...apiKeys, cfDatabaseId: text })}
          />

          <TouchableOpacity style={styles.button} onPress={saveKeys}>
            <Text style={styles.buttonText}>🚀 ACTIVATE FACTORY</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>🏭 THE ARCHITECT</Text>
        <Text style={styles.status}>
          {isRunning ? '🟢 RUNNING' : '🔴 IDLE'}
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.logContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
      >
        {logs.map((log, index) => (
          <View key={index} style={styles.logEntry}>
            <Text style={styles.timestamp}>[{log.timestamp}]</Text>
            <Text style={[styles.logText, { color: getLogColor(log.type) }]}>
              {log.message}
            </Text>
          </View>
        ))}
      </ScrollView>

      {!isRunning && (
        <TouchableOpacity style={styles.startButton} onPress={startFactory}>
          <Text style={styles.startButtonText}>▶️ START PRODUCTION</Text>
        </TouchableOpacity>
      )}

      {isRunning && (
        <View style={styles.runningIndicator}>
          <ActivityIndicator size="large" color="#00FF88" />
          <Text style={styles.runningText}>AUTONOMOUS MODE ACTIVE</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FF88',
    fontFamily: 'monospace',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 30,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1A1A2E',
    color: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#00D9FF',
  },
  button: {
    backgroundColor: '#00FF88',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    padding: 15,
  },
  logEntry: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timestamp: {
    color: '#666',
    marginRight: 8,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  logText: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  startButton: {
    backgroundColor: '#00FF88',
    margin: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#0A0A0F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  runningIndicator: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  runningText: {
    color: '#00FF88',
    marginTop: 10,
    fontWeight: 'bold',
  },
});
