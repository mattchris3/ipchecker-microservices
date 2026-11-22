<?php
// Counts the entries in a comma-separated list, including empty ones
// ("1.1.1.1,,8.8.8.8" is 3 entries). An empty input has no entries.
function getTotalIPs($items)
{
  if (trim((string) $items) === '') {
    return 0;
  }
  return count(explode(',', $items));
}
