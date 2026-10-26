#!/usr/bin/env python3
"""
CodeRaksh Company — Automated Workflow Setup & Credential Injector
Replaces all YOUR_... placeholders across all 26 workflows and outputs ready-to-import workflows.
"""

import os
import glob
import json

def load_env():
    env = {}
    if os.path.exists(".env"):
        with open(".env", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()
    return env

def main():
    print("=" * 65)
    print(" 🛡️  CODERAKSH COMPANY — WORKFLOW CREDENTIAL INJECTOR")
    print("=" * 65)
    
    env = load_env()
    
    sheet_id = env.get("GOOGLE_SHEET_ID") or input("Enter your Google Sheet ID [or press enter to skip]: ").strip() or "YOUR_GOOGLE_SHEET_ID"
    wa_id = env.get("WHATSAPP_PHONE_NUMBER_ID") or input("Enter your WhatsApp Phone Number ID: ").strip() or "YOUR_PHONE_NUMBER_ID"
    wa_num = env.get("WHATSAPP_RECIPIENT_NUMBER") or input("Enter your WhatsApp Recipient Number (e.g. 919820000000): ").strip() or "YOUR_WHATSAPP_NUMBER"
    owner_email = env.get("OWNER_EMAIL") or input("Enter your Founder / Owner Email: ").strip() or "YOUR_OWNER_EMAIL@example.com"
    gh_token = env.get("GITHUB_TOKEN") or input("Enter your GitHub Personal Access Token (for PR bot): ").strip() or "YOUR_GITHUB_TOKEN"
    
    replacements = {
        "YOUR_GOOGLE_SHEET_ID": sheet_id,
        "1PekwdOMv-gL8o6y3xGgVoltEnXlN4rOA": sheet_id,
        "YOUR_PHONE_NUMBER_ID": wa_id,
        "YOUR_WHATSAPP_NUMBER": wa_num,
        "917070709694": wa_num,
        "YOUR_OWNER_EMAIL@example.com": owner_email,
        "YOUR_GITHUB_TOKEN": gh_token,
    }

    out_dir = "configured_workflows"
    os.makedirs(out_dir, exist_ok=True)
    
    workflow_files = sorted([f for f in glob.glob("*.json") if f.startswith(("0", "1", "2"))])
    print(f"\nProcessing {len(workflow_files)} workflows into '{out_dir}/'...")
    
    count = 0
    for file_path in workflow_files:
        filename = os.path.basename(file_path)
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        for placeholder, value in replacements.items():
            if value and value != placeholder:
                content = content.replace(placeholder, value)
                
        out_path = os.path.join(out_dir, filename)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(content)
            
        print(f"  ✓ Configured: {filename}")
        count += 1
        
    print(f"\n🎉 Successfully configured all {count} workflows in '{out_dir}/'!")
    print("👉 You can now import any .json from 'configured_workflows/' directly into n8n.")

if __name__ == "__main__":
    main()
