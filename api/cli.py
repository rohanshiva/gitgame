import argparse
import sys
import anyio
import asyncpg
from services.github.client import GithubClient
from config import DB_URI, GITHUB_ACCESS_TOKEN


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


def display_gh_rate_limit(args: argparse.Namespace):
    async def display_rate_limit():
        gh_client = GithubClient(GITHUB_ACCESS_TOKEN)
        rate_limit_result = await gh_client.get_rate_limit()
        print(
            f"{rate_limit_result['used']} requests used out of {rate_limit_result['limit']}."
        )
        print(
            f"Refresh will occur at {rate_limit_result['reset'].strftime('%b %e %Y, %I:%M %p')}."
        )

    anyio.run(display_rate_limit)


def main():
    parser = argparse.ArgumentParser(
        description="A CLI to manage the DB and other tools when developing the Gitgame API",
    )

    subparsers = parser.add_subparsers(
        title="Sub-commands", help="The list of sub-commands to possibly run"
    )

    command_map = {
        "drop_tables": {"help": "Drops all the database tables", "func": drop_tables},
        "delete_rows": {"help": "Deletes all database table rows", "func": delete_rows},
        "show_rate_limit": {
            "help": "Displays the Github rate limit",
            "func": display_gh_rate_limit,
        },
    }

    for name in command_map:
        subparsers.add_parser(
            name,
            help=command_map[name]["help"],
        ).set_defaults(func=command_map[name]["func"])

    args = parser.parse_args(sys.argv[1:])
    args.func(args)


if __name__ == "__main__":
    main()
