from pony.orm import *

db = Database()
class Person(db.Entity):
    name = Required(str)
    age = Required(str)
    cars = Set('Car')

class Car(db.Entity):
    make = Required(str)
    model = Required(str)
    owner = Required(Person)

db.bind(provider="postgres", host="localhost", user="postgres", password="gitgame_password", database="gitgame_db", port="5433")
db.generate_mapping(create_tables=True)