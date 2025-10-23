# Inter-Agent Communication Protocol

## Message Format

```json
{
  "id": "unique-message-id",
  "timestamp": "ISO-8601",
  "from": "agent-identifier",
  "to": "agent-identifier",
  "type": "request|response|notification",
  "priority": "high|medium|low",
  "payload": {
    "task": "task-description",
    "context": {},
    "requirements": [],
    "constraints": []
  },
  "metadata": {
    "session": "session-id",
    "correlation": "correlation-id"
  }
}
```

## Task Delegation Flow

1. Task analysis by orchestrator
2. Agent selection and context preparation
3. Delegation and processing
4. Response and implementation
5. Validation and completion
