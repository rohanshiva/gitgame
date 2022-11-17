import argparse
import sys
import anyio
import asyncpg
from config import DB_URI


def drop_tables(args: argparse.Namespace):
    async def drop_all_tables(db_uri: str):
        db_conn = await asyncpg.connect(db_uri)
        tables = await db_conn.fetch(
            "SELECT * FROM pg_tables WHERE schemaname = 'public'"
        )
        drops = []
        for table in tables:
            drops.append(f"DROP TABLE IF EXISTS {table['tablename']} CASCADE;")
        drop_statement = "\n".join(drops)
        await db_conn.execute(drop_statement)

    resolved_db_uri = DB_URI.replace("host.docker.internal", "localhost")
    anyio.run(drop_all_tables, resolved_db_uri)
    print("Successfully dropped all tables!")


def delete_rows(args: argparse.Namespace):
    async def delete_all_rows(db_uri: str):
        db_conn = await asyncpg.connect(db_uri)
        tables = await db_conn.fetch(
            "SELECT * FROM pg_tables WHERE schemaname = 'public'"
        )
        deletes = []
        for table in tables:
            deletes.append(f"DELETE FROM {table['tablename']} CASCADE;")
        delete_statement = "\n".join(deletes)
        await db_conn.execute(delete_statement)

    resolved_db_uri = DB_URI.replace("host.docker.internal", "localhost")
    anyio.run(delete_all_rows, resolved_db_uri)
    print("Successfully deleted all rows!")


def main():
    parser = argparse.ArgumentParser(
        description="A CLI to manage the DB and other tools when developing the Gitgame API",
    )

    subparsers = parser.add_subparsers(
        title="Sub-commands", help="The list of sub-commands to possibly run"
    )
    subparsers.add_parser(
        "drop_tables", help="Drops all the database tables"
    ).set_defaults(func=drop_tables)
    subparsers.add_parser(
        "delete_rows", help="Deletes all database table rows"
    ).set_defaults(func=delete_rows)

    args = parser.parse_args(sys.argv[1:])
    args.func(args)


if __name__ == "__main__":
    main()
