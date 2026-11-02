"""Mint single-use tester codes (grants Pro on redeem at /testers?code=...).

Run inside the api container:
  docker exec cf_api python scripts/mint_tester_code.py 10 "reddit r/socialskills batch"
Prints one code per line. List redemptions:
  docker exec cf_api python scripts/mint_tester_code.py --list
"""
import asyncio
import secrets
import sys

from sqlalchemy import select

from db import async_session
from models.tester_code import TesterCode

ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def new_code() -> str:
    return "CF-" + "".join(secrets.choice(ALPHABET) for _ in range(8))


async def main() -> None:
    async with async_session() as db:
        if sys.argv[1:2] == ["--list"]:
            for r in (await db.execute(select(TesterCode).order_by(TesterCode.created_at))).scalars():
                print(r.code, r.note or "-", "redeemed " + str(r.redeemed_at) if r.redeemed_by else "unused")
            return
        n = int(sys.argv[1]) if len(sys.argv) > 1 else 1
        note = sys.argv[2] if len(sys.argv) > 2 else None
        for _ in range(n):
            code = new_code()
            db.add(TesterCode(code=code, note=note))
            print(code)
        await db.commit()


asyncio.run(main())
