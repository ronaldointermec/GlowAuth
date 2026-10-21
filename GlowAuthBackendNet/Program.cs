using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// 1. Configurando as regras de CORS para o seu Front-end Vite conseguir conversar com o .NET
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173") // URL do seu Vite
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Suporte nativo do .NET 10 para documentação OpenAPI
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

//app.UseHttpsRedirection();
app.UseCors();

// 2. Rota correspondente ao /auth/google com diagnóstico de chaves avançado
app.MapPost("/auth/google", async ([FromBody] TokenRequest request, IConfiguration config) =>
{
    // Printa o ID que está atualmente configurado no seu appsettings.Development.json
    string clientIdConfigurado = config["Google:ClientId"] ?? "";
    //Console.WriteLine($"\n================ DIAGNÓSTICO DE CREDENCIAIS ================");
    //Console.WriteLine($"[CONFIG SERVER] O ID carregado do appsettings é: {clientIdConfigurado}");

    //// Decodifica o token de forma manual para descobrir o ID real enviado pelo Google/Front-end
    //string clientIdVindoDoGoogle = ObterAudienceSemValidar(request.Token);
    //Console.WriteLine($"[JWT FRONTEND ] O ID que veio dentro do token do front é : {clientIdVindoDoGoogle}");
    //Console.WriteLine($"============================================================\n");

    try
    {
        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = new[] { clientIdConfigurado }
        };

        // O .NET faz o download das chaves públicas do Google e descriptografa o JWT recebido
        var payload = await GoogleJsonWebSignature.ValidateAsync(request.Token, settings);

        // LOG ADICIONADO: Printa o sucesso da validação com o Nome e E-mail estruturados
        Console.WriteLine($"[AUTH] Usuário validado com sucesso: {payload.Name} ({payload.Email})");

        return Results.Ok(new
        {
            success = true,
            user = new
            {
                id = payload.Subject,
                name = payload.Name,
                email = payload.Email,
                picture = payload.Picture
            }
        });
    }
    catch (InvalidJwtException ex)
    {
        Console.WriteLine($"[ERRO DE AUTH NET] Validação recusada: {ex.Message}");
        return Results.Json(new { success = false, error = "Falha na autenticação" }, statusCode: 401);
    }
});

app.Run();

// Função auxiliar usando tratamento de string base64 puro para evitar erros de namespace ausente
string ObterAudienceSemValidar(string token)
{
    try
    {
        var partes = token.Split('.');
        if (partes.Length < 2) return "Token inválido/mal formatado";

        string payloadBase64 = partes[1].Replace('-', '+').Replace('_', '/');
        switch (payloadBase64.Length % 4)
        {
            case 2: payloadBase64 += "=="; break;
            case 3: payloadBase64 += "="; break;
        }

        var bytes = Convert.FromBase64String(payloadBase64);
        var jsonTexto = Encoding.UTF8.GetString(bytes);

        using var jsonDoc = JsonDocument.Parse(jsonTexto);
        if (jsonDoc.RootElement.TryGetProperty("aud", out var audElemento))
        {
            return audElemento.GetString() ?? "Propriedade aud vazia";
        }
        return "Claim 'aud' não encontrada no payload";
    }
    catch (Exception ex)
    {
        return $"Erro ao decodificar: {ex.Message}";
    }
}

public record TokenRequest(string Token);
