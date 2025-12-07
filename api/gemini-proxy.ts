
// This file is deprecated. Please use /api/chat.ts instead.
export default function handler(req: any, res: any) {
    res.status(410).json({ error: "This endpoint is deprecated. Please use /api/chat" });
}
