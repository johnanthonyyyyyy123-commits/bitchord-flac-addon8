import { createBitChordAuth } from "./bitchord-addon-auth.mjs"

// Recommended: only the official BitChord app gets past this. See Addon auth.
const bitchord = createBitChordAuth({ hosts: ["audio.example"] })

const tracks = [
  {
    id: "track_8f31",
    title: "Midnight Signal",
    artist: "Example Artist",
    album: "Night Drive",
    duration: 242,
    artworkURL: "https://audio.example/art/8f31.jpg",
    format: "flac",
    audioQuality: "LOSSLESS"
  }
]

const MANIFEST = {
  id: "dev.example.reference-addon",
  name: "Reference Addon",
  version: "1.0.0",
  resources: ["search", "stream"],
  bitchordAuth: true
}

export async function handleRequest(request) {
  const url = new URL(request.url)

  if (url.pathname === "/manifest.json") {
    return json(MANIFEST) // stays public
  }

  const denied = await bitchord.guard(request) // 401 for anything but BitChord
  if (denied) return denied

  if (url.pathname === "/search") {
    const query = (url.searchParams.get("q") || "").toLowerCase()
    return json({
      tracks: tracks.filter((track) =>
        [track.title, track.artist, track.album]
          .join(" ").toLowerCase().includes(query)
      )
    })
  }

  if (url.pathname.startsWith("/stream/")) {
    const id = decodeURIComponent(url.pathname.slice(8))
    if (!tracks.some((track) => track.id === id)) {
      return new Response(null, { status: 404 })
    }
    return json({
      url: signedMediaUrl(id),
      codec: "flac",
      container: "flac",
      manifest: "none",
      encrypted: false,
      sampleRate: 96000,
      bitDepth: 24
    })
  }

  return new Response(null, { status: 404 })
}

function json(value) {
  return Response.json(value, {
    headers: { "Cache-Control": "no-store" }
  })
}

function signedMediaUrl(id) {
  // Sign and expire this in production: see Short-lived media URLs.
  return `https://audio.example/media/${encodeURIComponent(id)}.flac`
        }
