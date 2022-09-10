import argparse
import sys
import anyio
import asyncpg
from config import DB_URI

# A simple CLI for different management operations for the API
def wipe_db_tables(args: argparse.Namespace):
    async def drop_all(db_uri: str):
        db_conn = await asyncpg.connect(db_uri)
        tables = await db_conn.fetch(
            "SELECT * FROM pg_tables WHERE schemaname = 'public'"
        )
        if tables:
            drops = []
            for table in tables:
                drops.append(f"DROP TABLE IF EXISTS {table['tablename']} CASCADE;")
            drop_statement = "\n".join(drops)
            print("Drop query:\n", drop_statement)
            await db_conn.execute(drop_statement)
        else:
            print("No tables to drop...")

    resolved_db_uri = DB_URI.replace("host.docker.internal", "localhost")
    anyio.run(drop_all, resolved_db_uri)
    print("Successfully dropped tables!")


def main():
    parser = argparse.ArgumentParser(
        description="An utility to help manually manage the DB and the other tools/services when developing the API",
    )

    subparsers = parser.add_subparsers(
        title="Sub-commands", help="The list of sub-commands to possibly run"
    )
    subparsers.add_parser(
        "wipe_tables", help="Wipes all the database tables and rows"
    ).set_defaults(func=wipe_db_tables)

    args = parser.parse_args(sys.argv[1:])
    args.func(args)


if __name__ == "__main__":
    main()
