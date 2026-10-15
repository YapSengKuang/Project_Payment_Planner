# Pilot session guide

Use this guide for 3 to 5 Australian freelancers or small-agency owners who quote fixed-price projects. Confirm the audience hypothesis with discovery; a successful usability test does not prove demand. Recruit through the owner's channels. No outreach is authorized by this guide.

Ask permission to observe and take notes. Use participant IDs P01 to P05; keep identities, recordings, contact details and confidential project data outside Git. Use fictional data or a participant's sanitized example. Do not collect passwords, auth links or tokens. Record the exact candidate commit, URL, device/browser and date.

## Tasks to read to the participant

Give the goal before giving interface instructions. Observe without demonstrating each click. Record any assistance; do not count an assisted task as independent success.

1. Sign in and create a fictional $10,000 AUD project, GST inclusive, starting cash $0, running 1 to 30 November 2026. Save it and reopen it after a reload.
2. Enter a $3,000 materials expense due 5 November and a $4,000 labour expense due 20 November.
3. Add a $2,000 deposit received 1 November and an $8,000 delivery milestone completed and invoiced 8 November, with seven calendar days to pay. Explain when you expect the delivery receipt.
4. Find the first cash shortage and largest amount of additional funding needed. Explain what caused it in your own words.
5. Explore a larger deposit while keeping the price unchanged. Explain whether the change closes the shortage. Save the result as a named revision.
6. Test receipts arriving seven days late and expenses rising 10%. Explain what changed, including any remaining gap. Preserve the scenario as another revision.
7. Reload and reopen both revisions. Produce a PDF for discussion. Explain whether the proposal changes the original invoice or confirms payment.
8. Sign out and confirm that private project details disappear. Sign back in and reopen your work.

Only after the independent task, offer Load demo projects to explore the broader sample scenarios. Showing the samples beforehand exposes expected results and can bias the observed task.

## Observer answer key

Use the 2026-11-01 example independently checked in `fixtures/reference-projects.json` and `scripts/check_reference_projects.py` for the original gap. For the task above: the delivery receipt is 15 November, first shortage is 5 November, maximum original gap $1,000 and closing cash $3,000. A $3,000 deposit and $7,000 final milestone removes the original gap. With that revised schedule plus seven-day receipt delays and 10% higher costs, first shortage is 5 November, maximum gap $3,300 and closing cash $2,300. The plan includes dates after the project end when relevant. Expected receipts are forecasts; same-day movements net at daily close.

If the participant makes another valid proposal, calculate its expected results independently rather than applying this answer key. Check total client payments remain $10,000 and all changed amounts/dates retain reasons. A saved revision must preserve its original baseline even after working-project edits.

## Session record template

| Field | Observation |
| --- | --- |
| Participant ID and date | Pending |
| Candidate commit / URL | |
| Device / browser / viewport | |
| Segment and current planning tool | |
| Tasks completed independently / total | |
| Elapsed minutes to first usable saved plan | |
| Assistance needed and exact point of confusion | |
| Participant's explanation of the gap | |
| Would change proposed payment terms? Why? | |
| PDF readable and complete? | |
| Issue IDs, severity and reproduction steps | |
| Observed behaviour versus interpretation | |

Targets for time and completion are not yet validated; report observed values before choosing thresholds. Never fill missing results with estimates.

## Review

Summarize patterns and contradictory findings after 3 to 5 sessions. Prioritize incorrect calculations, access failures and blocked workflows first, then usability issues. Assign issue IDs and record fix commit plus retest evidence. Decide whether to release, revise the hypothesis or conduct another pilot; record who made the decision and why.
