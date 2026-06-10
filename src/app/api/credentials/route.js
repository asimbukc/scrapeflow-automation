// File Path: /src/app/api/credentials/route.js
import { NextResponse } from "next/server";
import { CredentialRepository } from "@/lib/db/repository";

function encodeValue(val) {
  return Buffer.from(val).toString("base64");
}

function decodeValue(val) {
  try {
    return Buffer.from(val, "base64").toString("utf-8");
  } catch (e) {
    return val;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") || "anonymous";

    const list = await CredentialRepository.findByOwner(username);
    
    const readable = list.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      value: decodeValue(c.value),
      createdAt: c.createdAt
    }));

    return NextResponse.json(readable);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { username, name, type, value } = await request.json();
    if (!name || !type || !value) {
      return NextResponse.json({ error: "Missing required credential parameters" }, { status: 400 });
    }

    const owner = username ? username.toLowerCase() : "anonymous";
    const uuid = 'cred-' + Math.random().toString(36).substr(2, 9);
    
    const newCred = {
      id: uuid,
      name,
      type,
      value: encodeValue(value),
      owner
    };

    const created = await CredentialRepository.createCredential(newCred);
    
    return NextResponse.json({
      id: created.id,
      name: created.name,
      type: created.type,
      value: decodeValue(created.value),
      createdAt: created.createdAt
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing credential ID parameter" }, { status: 400 });
    }

    await CredentialRepository.deleteCredential(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}