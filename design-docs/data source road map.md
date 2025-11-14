# Data source road map

This document provides goal and planning information for data source. As 排碳大戶觀測站 is a data intensive application, we need to carefully plan and manage our data sources to ensure optimal performance, scalability, and reliability.

## Goals

1. Unified data schema for UI layer.
   1. Although the way we collect and store data evolve over time, be sure to keep the data schema for UI layer consistent.
   2. We can use nuxt composables and proper types to encapsulate the data schema for UI layer.
2. Ensure transparency and traceability of data sources.
   1. Document the source of each data point used in the application.
   2. Maintain a changelog for data updates and modifications.
   3. Log success & failure of data fetching and processing.

## Data characters

排碳大戶觀測站 serve UI using historical company ESG data. The data has following characters:

1. Mostly tabular data.
2. Data volume grows over time, as we will monitor more companies and longer history.
3. Data update frequency is low, mostly on monthly or quarterly basis. So we can use static data files or cache to serve data.
4. Data will be transformed into various visualizations. Create a flexible data schema to support various visualizations is important.

## Road map

### Phase 1: read data from static spreadsheets

1. All data are stored in a google spreadsheet.
2. Download the spreadsheet as CSV files and store them in the `raw-data/` directory.
3. Use scripts to transform the raw CSV files into JSON files with unified data schema for UI layer.
   1. Store the transformed JSON files in the `app/assets/data/` directory.

### Phase 2: automate data fetching and processing

TBD

