import { useEffect, useState } from "react";
import "./App.css";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
}

function App() {
  // 1. O estado agora inicia tentando ler o que já está gravado no LocalStorage
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem("@GlowAuth:user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  async function handleCredentialResponse(
    response: google.accounts.CredentialResponse,
  ) {
    try {
      const res = await fetch("http://localhost:3000/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });

      if (!res.ok) throw new Error("Erro na validação do servidor");

      const data = await res.json();

      if (data.success) {
        // 2. SALVA NO LOCALSTORAGE: Transforma o objeto do usuário em texto e grava no navegador
        localStorage.setItem("@GlowAuth:user", JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  }

  useEffect(() => {
    if (!user) {
      // Criamos uma função interna para encapsular a lógica
      const renderGoogleButton = () => {
        window.google?.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        const buttonDiv = document.getElementById("buttonDiv");
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: "outline",
            size: "large",
            width: 250,
          });
        }
      };

      // O setTimeout com 0 força o código a rodar na próxima "fração de segundo",
      // garantindo que a <div id="buttonDiv"> já apareceu no HTML
      setTimeout(renderGoogleButton, 0);
    }
  }, [user]);

  const handleLogout = () => {
    // 3. LIMPA O LOCALSTORAGE: Remove a chave do navegador para deslogar completamente
    localStorage.removeItem("@GlowAuth:user");
    setUser(null);
  };

  return (
    <div className="login-container">
      {!user ? (
        <>
          <h2>GlowAuth - Google SSO</h2>
          <p>Clique abaixo para testar a autenticação:</p>
          <div id="buttonDiv"></div>
        </>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img
            src={user.picture}
            alt={user.name}
            referrerPolicy="no-referrer"
            style={{
              borderRadius: "50%",
              width: "96px",
              height: "96px",
              marginBottom: "1rem",
              border: "3px solid #4285F4",
            }}
          />
          <h2 style={{ margin: "0" }}>Olá, {user.name}!</h2>
          <p style={{ margin: "0.5rem 0 1.5rem 0", color: "#b3b3b3" }}>
            {user.email}
          </p>

          <button
            onClick={handleLogout}
            style={{
              padding: "10px 20px",
              backgroundColor: "#d93025",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Sair da Conta
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
