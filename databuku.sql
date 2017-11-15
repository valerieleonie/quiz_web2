create database databuku;
use databuku;
create table databuku (
id int auto_increment primary key,
buku varchar(100),
isbn varchar(100)
);
insert into databuku values (
1, 'Harry Potter and the Cursed Child',
'9788380082281');
