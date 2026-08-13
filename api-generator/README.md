# 🚀 SkillBattle API Generator

Automatically generate official SkillBattle SDKs from the FastAPI OpenAPI specification.

---

## 📁 Project Structure

```
api-generator/

├── generated/
│   ├── python/
│   ├── typescript/
│   └── java/
│
├── scripts/
│   ├── generate_python.ps1
│   ├── generate_typescript.ps1
│   ├── generate_java.ps1
│   └── generate_all.ps1
│
├── openapi-config.yaml
└── README.md
```

---

## 📋 Prerequisites

Before generating SDKs, ensure:

- Java JDK 21 or later is installed
- FastAPI backend is running
- OpenAPI Generator CLI JAR is downloaded

Example location:

```
D:\Tools\OpenAPI\openapi-generator-cli.jar
```

Verify Java:

```powershell
java -version
```

---

## ▶ Start Backend

From the backend directory:

```powershell
python -m uvicorn app.main:app --reload --port 8001
```

Swagger UI:

```
http://localhost:8001/docs
```

OpenAPI JSON:

```
http://localhost:8001/openapi.json
```

---

# Generate Python SDK

```powershell
.\scripts\generate_python.ps1
```

Output:

```
generated/python/
```

---

# Generate TypeScript SDK

```powershell
.\scripts\generate_typescript.ps1
```

Output:

```
generated/typescript/
```

---

# Generate Java SDK

```powershell
.\scripts\generate_java.ps1
```

Output:

```
generated/java/
```

---

# Generate All SDKs

```powershell
.\scripts\generate_all.ps1
```

This generates:

- Python SDK
- TypeScript SDK
- Java SDK

---

# Supported Languages

- ✅ Python
- ✅ TypeScript
- ✅ Java

Planned:

- Go
- C#
- Kotlin
- Swift
- Dart
- PHP
- Rust

---

# Version

Current API Version:

```
v1
```

Generated From:

```
http://localhost:8001/openapi.json
```

---

# License

MIT License

Copyright © SkillBattle