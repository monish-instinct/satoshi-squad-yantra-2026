# Tutorial: satoshi-squad-yantra-2026

PharmaShield is a secure supply chain verification platform designed to combat pharmaceutical counterfeiting. It uses **Web3 Wallet Authentication** for identity and enforces fine-grained access via **Role-Based Access Control (RBAC)**. When *drug batches* are registered, immutable metadata is secured on **IPFS** and indexed on the Ethereum Sepolia blockchain via the **Blockchain Contract Interface**. Crucially, every verification scan is passed through an **Anomaly Detection Engine** which generates real-time security events captured in the **Core Logging and Auditing** system.


## Visual Overview

```mermaid
flowchart TD
    A0["Web3 Wallet Authentication
"]
    A1["Batch Data Model (The Core Asset)
"]
    A2["Blockchain Contract Interface
"]
    A3["Role-Based Access Control (RBAC)
"]
    A4["IPFS Metadata Handling
"]
    A5["Anomaly Detection Engine
"]
    A6["Core Logging and Auditing
"]
    A7["Frontend Component Styling System
"]
    A0 -- "Enables permission layer" --> A3
    A3 -- "Defines visual presentation..." --> A7
    A7 -- "Styles components triggerin..." --> A2
    A2 -- "Retrieves hash for metadata..." --> A4
    A4 -- "Provides immutable hash for..." --> A1
    A1 -- "Provides context (expiry/st..." --> A5
    A5 -- "Logs risk events and alerts" --> A6
    A6 -- "Records authenticated actor..." --> A0
```
