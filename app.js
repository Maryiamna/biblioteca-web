const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const ejs = require('ejs');
const path = require('path');

const app = express();
const port = 3000;

//criando a conexão com o banco
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'biblioteca'
});

//conectando com o banco
db.connect((error) => {
  if (error) {
    console.error('Erro ao conectar ao MySQL:', error)
  } else {
    console.log("Conectado ao MySQL!")
  }
});

app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static('public'));
app.use(express.static('src'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get(['/', '/home'], (req, res) => {
  res.render('home');
});

app.get('/acervo', (req, res) => {
  db.query('select a.nome as autor, l.titulo, l.ISBN, l.ano_publicacao from livro l join autor a on l.id_autor = a.id_autor;', (error, results) => {
    if (error) {
      console.log('Erro ao recuperar os livros', error)
    } else {
      res.render('acervo', { livros: results })
    }
  });
});

app.get('/pesquisarLivros', (req, res) => {
  const pesquisa = req.query.pesquisa;
  console.log(pesquisa)
  db.query('select a.nome as autor, l.titulo, l.ISBN, l.ano_publicacao from livro l join autor a on l.id_autor = a.id_autor where l.titulo like ? or a.nome like ?', [`%${pesquisa}%`, `%${pesquisa}%`], (error, results) => {
    if (error) {
      console.log('Ocorreu um erro ao realizar o filtro')
    } else {
      res.render('acervo', { livros: results })
    }
  });
});

const carregarAutores = (callback) => {
  db.query('select * from autor order by nome', (error, results) => {
    if (error) {
      console.log('Erro ao carregar autores', error);
    } else {
      const autores = results.map(result => result)
      callback(null, autores);
    }
  });
}

app.get('/livro', (req, res) => {
  const ISBN = req.query.ISBN;
  console.log(ISBN)
  carregarAutores((error, listaAutores) => {
    db.query('Select * from livro where ISBN = ?', [ISBN], (error, results) => {
      if (error) {
        console.log('Erro ao buscar o livro com ISBN', ISBN)
      } else {
        if (results.length > 0) {
          res.render('livro', { autores: listaAutores, livro: results[0] });
        } else {
          console.log('Livro não encontrado')
        }
      }
    })
  })
});
// get = query, post = body
app.post('/editarLivro', (req, res) => {
  const ISBN = parseInt(req.body.inputISBN);
  const id_autor = parseInt(req.body.inputAutor);
  const titulo = req.body.inputTitulo;
  const ano_publicacao = parseInt(req.body.inputAnoPublicacao);
  const genero = req.body.inputGenero;
  const resumo = req.body.textResumo;

  db.query('update livro set ISBN = ?, titulo = ?, id_autor = ?, ano_publicacao = ?, genero = ?, resumo = ? where ISBN = ?', [ISBN, titulo, id_autor, ano_publicacao, genero, resumo, ISBN], (error, results) => {
    if (error) {
      console.log('Erro ao editar livro')
    } else {
      res.redirect('/acervo')
    }
  })
});

app.post('excluirLivro/:ISBN', (req, res) => {
  const ISBN = parseInt(req.params.ISBN)
  console.log(ISBN)
})


app.get(['/usuario'], (req, res) => {
  db.query('select count(e.id_emprestimo) as qtd_emprestimo, u.id_usuario, u.nome , u.email from usuario u left join emprestimo e on u.id_usuario = e.id_usuario group by u.id_usuario;', (error, results) => {
    if (error) {
      console.log('Houve um erro ao recuperar os usuários')
    } else {
      res.render('usuario', { usuarios: results })
    }
  })
})

app.get('/pesquisarUsuarios', (req, res) => {
  const pesquisa = req.query.pesquisa;
  console.log(pesquisa)
  db.query('select count(e.id_emprestimo) as qtd_emprestimo, u.id_usuario, u.nome , u.email from usuario u left join emprestimo e on u.id_usuario = e.id_usuario where nome like ? or email like ? group by u.id_usuario; ', [`%${pesquisa}%`, `%${pesquisa}%`], (error, results) => {
    if (error) {
      console.log('Ocorreu um erro ao realizar o filtro')
    } else {
      res.render('usuario', { usuarios: results })
    }
  });
});


app.get('/infoUsuario', (req, res) => {
  const id_usuario = req.query.id_usuario;
  console.log(id_usuario)

  db.query('select * from usuario where id_usuario = ?', [id_usuario], (error, results) => {
    if (error) {
      console.log('Error ao buscar usuário por ID', id_usuario)
    } else {
      if (results.length > 0) {
        res.render('infoUsuario', { info_usuario: results[0] });
      } else {
        console.log('usuario não encontrado.')
      }
    }
  })
})


app.post('/editarUsuario', (req, res) => {
  const id_usuario = parseInt(req.body.inputUsuario)
  const nome = req.body.inputNome
  const email = req.body.inputEmail
  const senha = parseInt(req.body.inputSenha)
  db.query('update usuario set id_usuario = ?, nome = ?, email = ?, senha = ? where id_usuario = ?', [id_usuario, nome, email, senha, id_usuario], (error, results) => {
    if (error) {
      console.log('Erro ao editar usuário.')
    } else {
      res.redirect('/usuario')
    }
  })
})


app.get('/cadastrarUsuario', (req, res) => {
  res.render('cadastrarUsuario');
})

app.post('/criarUsuario', (req, res) => {
  const nome = req.body.inputNome
  const email = req.body.inputEmail
  const senha = parseInt(req.body.inputSenha)
  db.query('insert into usuario (nome, email, senha) values (?, ?, ?)', [nome, email, senha], (error, results) => {
    if (error) {
      console.log('Erro ao cadastrar usuário.')
    } else {
      res.redirect('/usuario')
    }
  })
})


app.post('/excluirUsuario/:id_usuario', (req, res) => {
  const id_usuario = parseInt(req.params.id_usuario)
  console.log(id_usuario)
  db.query('delete from usuario where id_usuario = ?', [id_usuario], (error, results) => {
    if (error) {
      console.log('Erro ao excluir o usuário')
    } else {
      res.redirect('/usuario')
    }
  })
});


app.listen(port, () => {
  console.log(`Servidor iniciado em http://localhost:${port}`);
});