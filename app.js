const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const ejs = require('ejs');
const path = require('path');
const { error } = require('console');

const app = express();
const port = 3000;

//criando a conexão com o banco
const db = mysql.createConnection({
  host: 'localhost',
  user:'root',
  password: '',
  database:'biblioteca'
});

//conectando com o banco
db.connect((error) => {
if(error){
  console.error('Erro ao conectar ao MySQL:', error)
}else{
  console.log("Conectado ao MySQL!")
}
});

app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static('public'));
app.use(express.static('src'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.listen(port, () => {
  console.log(`Servidor iniciado em http://localhost:${port}`);
});

app.get('/acervo', (req,res) => {
  db.query('select a.nome as autor, l.titulo, l.isbn as ISBN, l.ano_publicacao from livro l join autor a on l.id_autor = a.id_autor; ', (error,results)=>{
 if(error){
  console.log('houve um erro ao recuperar os livros')
 } else{
  res.render('acervo', {livros: results})
 }
})
});

//o query vem da URL e o body vem do JSON
app.get('/pesquisarLivros' ,(req, res) => {
  const pesquisa = req.query.pesquisa;
  console.log(pesquisa)
  db.query('select a.nome as autor, l.titulo, l.isbn as ISBN, l.ano_publicacao from livro l join autor a on  l.id_autor = a.id_autor where l.titulo like ? or a.nome like ?', [`%${pesquisa}%`,`%${pesquisa}%` ], (error,results) =>{
    if(error){
      console.log('ocorreu um erro ao realizar o filtro')
    }else{
      res.render('acervo', {livros: results})
    }
  });
});



const carregarAutores = (callback) =>{
  db.query('select * from autor order by nome', (error,results) => {
    if(error){
      console.log('erro ao carregas os autores', error);
    }else{
      const autores = results.map(result => result)
      callback(null,autores);
    }
  });
}

app.get('/livro', (req, res) => {
  const ISBN = req.query.ISBN
  console.log(ISBN)
  carregarAutores((error,listaAutores) =>{
    db.query('select * from livro where ISBN=?', [ISBN], (error,results) =>{
      if(error){
        console.log('erro ao buscar o livro com ISBN', ISBN)
      }else{
        if(results.length > 0){
          res.render('livro', {autores: listaAutores, livro:results[0]});
        }else{
          console.log('livro não encontrado')
        }
      }
    })
  })
})



app.post('/editarLivro', (req, res) =>{
  const ISBN = parseInt(req.body.inputISBN);
  const id_autor = parseInt(req.body.inputAutor);
  const titulo = req.body.inputTitulo;
  const ano_publicacao = parseInt(req.body.inputAnoPublicacao);
  const genero = req.body.inputGenero;
  const resumo = req.body.textResumo;
  db.query('update livro set ISBN = ?, titulo = ?, id_autor = ?, ano_publicacao = ?, genero = ?, resumo = ? where ISBN = ?', [ISBN, titulo, id_autor, ano_publicacao, genero, resumo, ISBN], (error, results) =>{
    if(error){
      console.log('Erro ao editar Livro');
    } else {
      res.redirect('/acervo');
    }
  })
})

  app.post('/excluirLivro/:ISBN', (req,res)=>{
    const ISBN = parseInt(req.params.ISBN)
    console.log(ISBN)
    db.query('delete from livro where ISBN = ?' [ISBN], (error, results) =>{
      if(error){
        console.log('erro ao excluir o livro')
      }else{
        res.redirect('/acervo')
      }
    })
  });


  app.get(['/','/home'], (req,res) => {
    db.query('SELECT e.id_emprestimo, e.data_emprestimo, CASE WHEN DATEDIFF(CURRENT_DATE, e.data_emprestimo) >= 30 THEN DATEDIFF(CURRENT_DATE, e.data_emprestimo) - 30 ELSE NULL END AS dias_atraso, e.id_usuario, u.nome, l.titulo FROM emprestimo e JOIN usuario u ON e.id_usuario = u.id_usuario JOIN livro l ON e.id_livro = l.ISBN WHERE e.data_devolucao IS NULL AND DATEDIFF(CURRENT_DATE, e.data_emprestimo) >= 30', (error,results)=>{
      if(error){
        console.log('houve um erro ao receber as informações do livro')
      } else{
        res.render('home', {emprestimos: results})
      }
    })
  });
  

  //o query vem da URL e o body vem do JSON
app.get('/pesquisarHome' ,(req, res) => {
  const pesquisa = req.query.pesquisa;
  console.log(pesquisa)
  db.query('SELECT e.id_emprestimo, e.data_emprestimo, CASE WHEN DATEDIFF(CURRENT_DATE, e.data_emprestimo) >= 30 THEN DATEDIFF(CURRENT_DATE, e.data_emprestimo) - 30 ELSE NULL END AS dias_atraso, e.id_usuario, u.nome, l.titulo FROM emprestimo e JOIN usuario u ON e.id_usuario = u.id_usuario JOIN livro l ON e.id_livro = l.ISBN WHERE e.data_devolucao IS NULL AND DATEDIFF(CURRENT_DATE, e.data_emprestimo) >= 30 AND l.titulo LIKE ? or u.nome LIKE ?;', [`%${pesquisa}%`,`%${pesquisa}%` ], (error,results) =>{
    if(error){
      console.log('ocorreu um erro ao realizar o filtro')
    }else{
      res.render('home', {emprestimos: results})
    }
  });
});