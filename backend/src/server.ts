import express, { Request, Response } from "express";
import cors from "cors";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const client = new OAuth2Client(CLIENT_ID);

app.post("/auth/google", async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ success: false, error: "Token não fornecido" });
    return;
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      res.status(400).json({ success: false, error: "Payload do token vazio" });
      return;
    }

    console.log(
      `[AUTH] Usuário validado com sucesso: ${payload.name} (${payload.email})`,
    );

    res.status(200).json({
      success: true,
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      },
    });
  } catch (error) {
    console.error("[CATCH ERROR] Falha na validação das assinaturas:", error);
    res
      .status(401)
      .json({ success: false, error: "Assinatura do token inválida" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor de validação rodando em http://localhost:${PORT}`),
);
