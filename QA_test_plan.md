# QA Test Plan

## Unit-like checks
- Storage: add/edit/delete favorites persists after reload
- Popup toggle: reflects and saves use_as_new_tab
- Background alarm: schedules and opens tab (active=false)

## Integration
- Load unpacked -> open new tab -> UI renders within 1s
- Reorder favorites via drag-and-drop persists
- Uninstall -> redirect to feedback URL

## Performance
- New tab loads quickly with minimal assets (<200KB local)
