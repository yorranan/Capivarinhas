const http = require("http"); // Permite criar servidores
const sistemaArquivos = require("fs"); // Permite ler e escrever no sistema de arquivos
const { URL } = require("url"); // Permite manipular e analisar URLs
const { randomUUID } = require("crypto"); // Permite gerar IDs únicos

const lerDados = (nomeArquivo) => {
  try {
    const dados = sistemaArquivos.readFileSync(
      `./dados/${nomeArquivo}.json`,
      "utf8"
    );
    return JSON.parse(dados); //Retorna lista de dados
  } catch (error) {
    console.error(`Erro ao ler o arquivo ${nomeArquivo}.json:`, error);
    return []; //Retorna lista vazia
  }
};

const escreverDados = (nomeArquivo, dados) => {
  try {
    sistemaArquivos.writeFileSync(
      `./dados/${nomeArquivo}.json`,
      JSON.stringify(dados, null, 2)
    );
  } catch (error) {
    console.error(`Erro ao escrever no arquivo ${nomeArquivo}.json:`, error);
  }
};

const servidor = http.createServer((requisicao, resposta) => {
  const URLParseada = new URL(
    requisicao.url,
    `http://${requisicao.headers.host}`
  ); // Criação de uma nova URL
  const { pathname } = URLParseada; // Extração apenas do caminho
  const metodo = requisicao.method; // Pega o método HTTP usado na requisição

  resposta.setHeader("Content-Type", "application/json"); //Informa que a requisição é to tipo JSON
  resposta.setHeader("Access-Control-Allow-Origin", "*"); // Permite requisições de qualquer origem para esse servidor (CORS)
  resposta.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  ); //Define quais métodos HTTP o servidor aceita.
  resposta.setHeader("Access-Control-Allow-Headers", "Content-Type"); // forma que o servidor permite o cabeçalho Content-Type nas resposta (necessário para enviar dados como JSON no corpo da requisição).

  // Responde a requisições OPTIONS, necessário para CORS
  // É como uma requisição prévia do navegador para o servidor
  if (metodo === "OPTIONS") {
    resposta.writeHead(204);
    resposta.end();
    return;
  }

  if (pathname.startsWith("/capivaras")) {
    const bandoCapivaras = lerDados("capivaras");
    const partesURL = pathname.split("/");
    const capivaraID = partesURL[2];

    // GET /capivaras -> Ler todas as capivaras
    if (metodo === "GET" && !capivaraID) {
      resposta.writeHead(200);
      resposta.end(JSON.stringify(bandoCapivaras));
      return;
    }

    // GET /capivaras/:id -> Ler uma capivara específica
    if (metodo === "GET" && capivaraID) {
      const capivara = bandoCapivaras.find((c) => c.id === capivaraID);
      if (capivara) {
        resposta.writeHead(200);
        resposta.end(JSON.stringify(capivara));
      } else {
        resposta.writeHead(404);
        resposta.end(JSON.stringify({ mensagem: "Capivara não encontrada." }));
      }
      return;
    }
    // POST /capivaras -> Criar uma nova capivara
    if (metodo === "POST") {
      let corpo = "";
      requisicao.on("data", (chunk) => {
        corpo += chunk.toString();
      });
      requisicao.on("end", () => {
        const { nome, dataNascimento, habitatId } = JSON.parse(corpo);
        if (!nome || !dataNascimento || !habitatId) {
          resposta.writeHead(400); // Bad Request
          resposta.end(
            JSON.stringify({
              mensagem:
                "Nome, data de nascimento e habitatId são obrigatórios.",
            })
          );
          return;
        }

        const novaCapivara = {
          id: randomUUID().slice(0, 8), // Gera um ID curto
          nome,
          dataNascimento,
          habitatId,
        };

        bandoCapivaras.push(novaCapivara);
        escreverDados("capivaras", bandoCapivaras);

        resposta.writeHead(201); // Created
        resposta.end(JSON.stringify(novaCapivara));
      });
      return;
    }
    // PUT /capivaras/:id -> Atualizar uma capivara
    if (metodo === "PUT" && capivaraID) {
      let corpo = "";
      requisicao.on("data", (chunk) => {
        corpo += chunk.toString();
      });
      requisicao.on("end", () => {
        const { nome, dataNascimento, habitatId } = JSON.parse(corpo);
        const indiceCapivara = bandoCapivaras.findIndex(
          (c) => c.id === capivaraID
        );

        if (indiceCapivara === -1) {
          resposta.writeHead(404);
          resposta.end(
            JSON.stringify({ mensagem: "Capivara não encontrada." })
          );
          return;
        }

        const capivaraAtualizada = {
          ...bandoCapivaras[indiceCapivara], // '...' é o operador spread que é usado para espalhar as propriedades de um objeto dentro de outro.
          nome: nome || bandoCapivaras[indiceCapivara].nome,
          dataNascimento:
            dataNascimento || bandoCapivaras[indiceCapivara].dataNascimento,
          habitatId: habitatId || bandoCapivaras[indiceCapivara].habitatId,
        };

        bandoCapivaras[indiceCapivara] = capivaraAtualizada;
        escreverDados("capivaras", bandoCapivaras);

        resposta.writeHead(200);
        resposta.end(JSON.stringify(capivaraAtualizada));
      });
      return;
    }
    // DELETE /capivaras/:id -> Deletar uma capivara
    if (metodo === "DELETE" && capivaraID) {
      const indiceCapivara = bandoCapivaras.findIndex(
        (c) => c.id === capivaraID
      );
        // Verifica se a capivara existe
      if (indiceCapivara === -1) {
        resposta.writeHead(404);
        resposta.end(JSON.stringify({ mensagem: "Capivara não encontrada." }));
        return;
      }
      bandoCapivaras.splice(indiceCapivara, 1);
      escreverDados("capivaras", bandoCapivaras);

      resposta.writeHead(200);
      resposta.end(
        JSON.stringify({ mensagem: "Capivara deletada com sucesso." })
      );
    }

    resposta.writeHead(404, { "Content-Type": "application/json" });
    resposta.end(JSON.stringify({ mensagem: "Rota não encontrada" }));
    return;
  }
});

const PORTA = 7000;
servidor.listen(PORTA, () => {
  console.log(`Servidor das capivarinhas http://localhost:${PORTA}/capivaras`);
});
