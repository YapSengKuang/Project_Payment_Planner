"""Check synthetic discovery fixtures; this is not the application forecast engine."""
import json
from collections import defaultdict
from datetime import date
from pathlib import Path


def check(project):
    assert type(project['starting_cash_cents']) is int
    assert project['starting_cash_cents'] >= 0
    assert type(project['price_cents']) is int and project['price_cents'] > 0
    assert sum(item['amount_cents'] for item in project['receipts']) == project['price_cents']
    movements = defaultdict(int)
    for category, sign in [('receipts', 1), ('expenses', -1)]:
        for item in project[category]:
            assert date.fromisoformat(item['date']).isoformat() == item['date']
            assert type(item['amount_cents']) is int and item['amount_cents'] > 0
            movements[item['date']] += sign * item['amount_cents']
    balance = minimum = project['starting_cash_cents']
    first_shortage = None
    for day, movement in sorted(movements.items()):
        balance += movement
        minimum = min(minimum, balance)
        if balance < 0 and first_shortage is None:
            first_shortage = day
    actual = dict(first_shortage_date=first_shortage,
                  maximum_gap_cents=max(0, -minimum), closing_cash_cents=balance)
    assert actual == project['expected'], (project['id'], actual, project['expected'])
    print(f"PASS {project['id']}: maximum gap {actual['maximum_gap_cents']} cents")


if __name__ == '__main__':
    path = Path(__file__).resolve().parents[1] / 'fixtures/reference-projects.json'
    projects = json.loads(path.read_text())['projects']
    assert len({project['id'] for project in projects}) == len(projects)
    for project in projects:
        check(project)
