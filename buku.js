const express = require('express');
const database = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');

// membuka koneksi ke database/atau buat baru
// const db = new database('country.db');
const db = database.createConnection({
    host: 'localhost',
    user: 'test',
    password: 'testing',
    database: 'databuku'
});

const http = express();

http.set('view engine', 'ejs');
http.set('views', 'views');

http.use(session({
  secret: 'rahasia',
  resave: false,
  saveUninitialized: true
}))

function dbQuery(db, query, params) {
    const promise = new Promise(function(resolve, reject) {
        db.query(query, params, function(err, results, fields) {
            if (err)
                reject(err);
            else
                resolve(results, fields);
        });
    });
    return promise;
}


http.use(bodyParser.urlencoded({ extended: false }))
http.use(bodyParser.json())

http.use((req, res, next) => {
    if (! req.session.flash)
        req.session.flash = [];

    next();
});

const n = 2;

http.get('/', (req, res) => {
    // pagination
    const page = parseInt(req.query.page ? req.query.page : 1);

    // hitung page
    var total = 0;

    dbQuery(db, 'select count(*) total from databuku').then((results, fields) => {
        total = results[0]['total'];
    });

    var rows = [];
    dbQuery(db, 'select * from databuku limit ? offset ?', [n, (page-1)*n])
    .then((results, fields) => {
            rows = results;
            res.render('buku', {databuku: rows, flash: req.session.flash, pagination: {page: page, total_pages: Math.floor(total/n, 1), prev_page: page > 1 ? page-1 : null, next_page: page < Math.floor(total/n, 1) ? page+1: null}});
    })
    .catch(err => {
        res.send('error');
        console.log(err);
    });
});

http.get('/saring', (req, res) => {
    var query = 'select * from databuku';
    var params = [];
    if (req.query.saring) {
        var query = 'select * from databuku where lower(buku) like "%" || ? || "%" or lower(buku) like "%" || ? || "%"';
        var params = [req.query.saring.toLowerCase(), req.query.saring.toLowerCase()];
    }

    dbQuery(db, query, params).then((results, fields) => {
        res.render('buku', {databuku: results, flash: req.session.flash, pagination: null});
    });
});

http.post('/', (req, res) => {
    const buku = req.body.buku;
    const isbn = req.body.isbn;

    dbQuery(db, 'insert into databuku(buku, isbn) values(?, ?)', [buku, isbn])
    .then((results, fields) => {
        req.session.flash.push({message: 'Data buku berhasil ditambah',
                    class: 'success'});

        res.redirect('/');
    });
});

http.get('/delete/:id', (req, res) => {
    const id = req.params.id;

    dbQuery(db, 'delete from databuku where id=?', [id])
    .then((results, fields) => {
        req.session.flash.push({message: 'Data buku berhasil dihapus',
            class: 'warning'});
        res.redirect('/');
    });
});

http.get('/update/:id', (req, res) => {
    const id = req.params.id;

    dbQuery(db, 'select * from databuku where id=?', [id])
    .then((results, fields) => {
        if (results.length >= 1)
            res.render('update', {databuku: results[0]});
        else
            res.status(404).send('Buku ' + id + ' not found');
    });
});

http.post('/update/:id', (req, res) => {
    const id = req.params.id;
    const buku = req.body.buku;
    const isbn = req.body.isbn;

    dbQuery(db, 'update databuku set buku=?, isbn=? where id=?', [buku, isbn, id])
    .then((results, fields) => {
        req.session.flash.push({message: 'Data buku berhasil diupdate',
                    class: 'success'});
        res.redirect('/');

    });
});

http.listen(3000, () => {
    console.log('listening on 3000...');
});
