<?php
// Counts the entries that are empty or only whitespace ("1.1.1.1, ,8.8.8.8" has 1).
// An empty input has no entries, so none are empty.
function getTotalEmptyIPs($items)
{
  if (trim((string) $items) === '') {
    return 0;
  }
  $empty = 0;
  foreach (explode(',', $items) as $entry) {
    if (trim($entry) === '') {
      $empty++;
    }
  }
  return $empty;
}
