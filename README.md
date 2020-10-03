# Reorder Playlist Spotify

Aplicação para ordenar playlists colaborativas do Spotify alternadamente de acordo com os colaboradores.

## Antes

![antes](https://i.imgur.com/jr2xDDm.png)

## Depois

![depois](https://i.imgur.com/2ZFGvu5.png)

## Rodando

Para rodar, você vai precisar ter `node` e `yarn` instalados na sua máquina local. Eu recomendo que o node seja instalado usando o [nvm (Node Version Manager)](https://github.com/nvm-sh/nvm#installing-and-updating), e o yarn pode ser instalado seguindo [esse tutorial](https://classic.yarnpkg.com/pt-BR/docs/install/#debian-stable).

Feito isso, clone o repositório com o comando:

```zsh
git clone https://github.com/lucasmedeiros/spotify-reorder-collaborative.git
cd spotify-reorder-collaborative
```

Instale as dependências da aplicação com o comando:

```zsh
yarn
```

Depois disso, você deve criar uma aplicação no [Spotify for Developers](https://developer.spotify.com/dashboard/login), seguindo o guia para [registro de apps](https://developer.spotify.com/documentation/general/guides/app-settings/#register-your-app). Feito isso, no Dashboard da tela do Spotify for Developers, deverá aparecer uma caixa com a sua aplicação.

Selecione a sua aplicação, e vá em **Edit Settings**, e na parte de **Redirect URI's** adicione `http://localhost:5000/auth/callback`.

Feito isso, perceba que na tela tem dois campos **SECRETOS**: o `Client ID` e o `Client Secret`. Você deverá copiar esses dois campos para um arquivo `.env` na pasta raiz do projeto, como listado no [arquivo de configuração exemplo](./.env.example). Ficará algo parecido com isso:

```
CLIENT_ID=your-client-id-here
CLIENT_SECRET=your-client-secret-here
```

Então, rode a aplicação com:

```zsh
yarn start
```

Então, a aplicação vai rodar no endereço `localhost:5000`. Para autorizar a aplicação, faça uma requisição HTTP para a rota `GET http://localhost:5000/` e aparecerá um link para que você possa fazer a autorização da aplicação para acessar suas playlists colaborativas.

![url](https://i.imgur.com/X6S8Y1l.png)

Finalmente, faça uma requição HTTP para `POST http://localhost:5000/reorder`, passando como corpo da requisição o nome da playlist colaborativa que você deseja ordenar alternadamente entre os contribuidores. Dentro de alguns segundos, sua playlist estará ordenada!
