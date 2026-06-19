# posthog-mcp MCP Server

Auto-generated from OpenAPI spec by `forge-skill-from-openapi --target=mcp-server`.
Transport: **stdio**

## Tools (1715)

- `code_invites_check_access_retrieve` — Check access
- `code_invites_redeem_create` — Redeem invite code
- `environments_alerts_list` — GET /api/environments/{environment_id}/alerts/
- `environments_alerts_create` — POST /api/environments/{environment_id}/alerts/
- `environments_alerts_retrieve` — GET /api/environments/{environment_id}/alerts/{id}/
- `environments_alerts_update` — PUT /api/environments/{environment_id}/alerts/{id}/
- `environments_alerts_partial_update` — PATCH /api/environments/{environment_id}/alerts/{id}/
- `environments_alerts_destroy` — DELETE /api/environments/{environment_id}/alerts/{id}/
- `environments_alerts_simulate_create` — Simulate a detector on an insight's historical data. Read-only — no AlertCheck records are created.
- `environments_batch_exports_list` — GET /api/environments/{environment_id}/batch_exports/
- `environments_batch_exports_create` — POST /api/environments/{environment_id}/batch_exports/
- `environments_batch_exports_backfills_list` — ViewSet for BatchExportBackfill models.

Allows creating and reading backfills, but not updating or deleting them.
- `environments_batch_exports_backfills_create` — Create a new backfill for a BatchExport.
- `environments_batch_exports_backfills_retrieve` — ViewSet for BatchExportBackfill models.

Allows creating and reading backfills, but not updating or deleting them.
- `environments_batch_exports_backfills_cancel_create` — Cancel a batch export backfill.
- `environments_batch_exports_runs_list` — GET /api/environments/{environment_id}/batch_exports/{batch_export_id}/runs/
- `environments_batch_exports_runs_retrieve` — GET /api/environments/{environment_id}/batch_exports/{batch_export_id}/runs/{id}/
- `environments_batch_exports_runs_cancel_create` — Cancel a batch export run.
- `environments_batch_exports_runs_logs_retrieve` — GET /api/environments/{environment_id}/batch_exports/{batch_export_id}/runs/{id}/logs/
- `environments_batch_exports_runs_retry_create` — Retry a batch export run.

We use the same underlying mechanism as when backfilling a batch export, as retrying
a run is the same as backfilling one run.
- `environments_batch_exports_retrieve` — GET /api/environments/{environment_id}/batch_exports/{id}/
- `environments_batch_exports_update` — PUT /api/environments/{environment_id}/batch_exports/{id}/
- `environments_batch_exports_partial_update` — PATCH /api/environments/{environment_id}/batch_exports/{id}/
- `environments_batch_exports_destroy` — DELETE /api/environments/{environment_id}/batch_exports/{id}/
- `environments_batch_exports_logs_retrieve` — GET /api/environments/{environment_id}/batch_exports/{id}/logs/
- `environments_batch_exports_pause_create` — Pause a BatchExport.
- `environments_batch_exports_run_test_step_create` — POST /api/environments/{environment_id}/batch_exports/{id}/run_test_step/
- `environments_batch_exports_unpause_create` — Unpause a BatchExport.
- `environments_batch_exports_run_test_step_new_create` — POST /api/environments/{environment_id}/batch_exports/run_test_step_new/
- `environments_batch_exports_test_retrieve` — GET /api/environments/{environment_id}/batch_exports/test/
- `environments_dashboards_list` — GET /api/environments/{environment_id}/dashboards/
- `environments_dashboards_create` — POST /api/environments/{environment_id}/dashboards/
- `environments_dashboards_collaborators_list` — GET /api/environments/{environment_id}/dashboards/{dashboard_id}/collaborators/
- `environments_dashboards_collaborators_create` — POST /api/environments/{environment_id}/dashboards/{dashboard_id}/collaborators/
- `environments_dashboards_collaborators_destroy` — DELETE /api/environments/{environment_id}/dashboards/{dashboard_id}/collaborators/{user__uuid}/
- `environments_dashboards_sharing_list` — GET /api/environments/{environment_id}/dashboards/{dashboard_id}/sharing/
- `environments_dashboards_sharing_passwords_create` — Create a new password for the sharing configuration.
- `environments_dashboards_sharing_passwords_destroy` — Delete a password from the sharing configuration.
- `environments_dashboards_sharing_refresh_create` — POST /api/environments/{environment_id}/dashboards/{dashboard_id}/sharing/refresh/
- `environments_dashboards_retrieve` — GET /api/environments/{environment_id}/dashboards/{id}/
- `environments_dashboards_update` — PUT /api/environments/{environment_id}/dashboards/{id}/
- `environments_dashboards_partial_update` — PATCH /api/environments/{environment_id}/dashboards/{id}/
- `environments_dashboards_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `environments_dashboards_analyze_refresh_result_create` — Generate AI analysis comparing before/after dashboard refresh.
Expects cache_key in request body pointing to the stored 'before' state.
- `environments_dashboards_copy_tile_create` — Copy an existing dashboard tile to another dashboard (insight or text card; new tile row).
- `environments_dashboards_create_text_tile_create` — Add a markdown text tile to a dashboard.

Text tiles render as markdown blocks on the dashboard — useful as section headings, dividers,
or annotations between insight tiles to give the dashboard structure.
- `environments_dashboards_move_tile_partial_update` — PATCH /api/environments/{environment_id}/dashboards/{id}/move_tile/
- `environments_dashboards_reorder_tiles_create` — POST /api/environments/{environment_id}/dashboards/{id}/reorder_tiles/
- `environments_dashboards_run_insights_retrieve` — Run all insights on a dashboard and return their results.
- `environments_dashboards_snapshot_create` — Snapshot the current dashboard state (from cache) for AI analysis.
Returns a cache_key representing the 'before' state, to be used with analyze_refresh_result.
- `environments_dashboards_stream_tiles_retrieve` — Stream dashboard metadata and tiles via Server-Sent Events. Sends metadata first, then tiles as they are rendered.
- `environments_dashboards_update_text_tile_create` — Update the markdown body, layout, or color of an existing text tile on a dashboard.
- `environments_dashboards_bulk_update_tags_create` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `environments_dashboards_create_from_template_json_create` — POST /api/environments/{environment_id}/dashboards/create_from_template_json/
- `environments_dashboards_create_unlisted_dashboard_create` — Creates an unlisted dashboard from template by tag.
Enforces uniqueness (one per tag per team).
Returns 409 if unlisted dashboard with this tag already exists.
- `environments_data_color_themes_list` — GET /api/environments/{environment_id}/data_color_themes/
- `environments_data_color_themes_create` — POST /api/environments/{environment_id}/data_color_themes/
- `environments_data_color_themes_retrieve` — GET /api/environments/{environment_id}/data_color_themes/{id}/
- `environments_data_color_themes_update` — PUT /api/environments/{environment_id}/data_color_themes/{id}/
- `environments_data_color_themes_partial_update` — PATCH /api/environments/{environment_id}/data_color_themes/{id}/
- `environments_data_color_themes_destroy` — DELETE /api/environments/{environment_id}/data_color_themes/{id}/
- `environments_data_modeling_jobs_list` — List data modeling jobs which are "runs" for our saved queries.
- `environments_data_modeling_jobs_retrieve` — List data modeling jobs which are "runs" for our saved queries.
- `environments_data_modeling_jobs_recent_retrieve` — Get the most recent non-running job for each saved query from the v2 backend.
- `environments_data_modeling_jobs_running_retrieve` — Get all currently running jobs from the v2 backend.
- `environments_data_warehouse_check_database_name_retrieve` — Check if a database name is available.
- `environments_data_warehouse_completed_activity_retrieve` — Returns completed/non-running activities (jobs with status 'Completed').
Supports pagination and cutoff time filtering.
- `environments_data_warehouse_data_health_issues_retrieve` — Returns failed/disabled data pipeline items for the Pipeline status side panel.
Includes: materializations, syncs, sources, destinations, and transformations.
- `environments_data_warehouse_data_ops_dashboard_retrieve` — Returns the data ops overview dashboard ID for this team, creating it if it doesn't exist yet.
- `environments_data_warehouse_deprovision_create` — Start deprovisioning the managed warehouse for this team.
- `environments_data_warehouse_job_stats_retrieve` — Returns success and failed job statistics for the last 1, 7, or 30 days.
Query parameter 'days' can be 1, 7, or 30 (default: 7).
- `environments_data_warehouse_property_values_retrieve` — API endpoints for data warehouse aggregate statistics and operations.
- `environments_data_warehouse_provision_create` — Start provisioning a managed warehouse for this team.
- `environments_data_warehouse_reset_password_create` — Reset the root password for the managed warehouse.
- `environments_data_warehouse_running_activity_retrieve` — Returns currently running activities (jobs with status 'Running').
Supports pagination and cutoff time filtering.
- `environments_data_warehouse_total_rows_stats_retrieve` — Returns aggregated statistics for the data warehouse total rows processed within the current billing period.
Used by the frontend data warehouse scene to display usage information.
- `environments_data_warehouse_warehouse_status_retrieve` — Get the current provisioning status of the managed warehouse.
- `environments_dataset_items_list` — GET /api/environments/{environment_id}/dataset_items/
- `environments_dataset_items_create` — POST /api/environments/{environment_id}/dataset_items/
- `environments_dataset_items_retrieve` — GET /api/environments/{environment_id}/dataset_items/{id}/
- `environments_dataset_items_update` — PUT /api/environments/{environment_id}/dataset_items/{id}/
- `environments_dataset_items_partial_update` — PATCH /api/environments/{environment_id}/dataset_items/{id}/
- `environments_dataset_items_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `environments_datasets_list` — GET /api/environments/{environment_id}/datasets/
- `environments_datasets_create` — POST /api/environments/{environment_id}/datasets/
- `environments_datasets_retrieve` — GET /api/environments/{environment_id}/datasets/{id}/
- `environments_datasets_update` — PUT /api/environments/{environment_id}/datasets/{id}/
- `environments_datasets_partial_update` — PATCH /api/environments/{environment_id}/datasets/{id}/
- `environments_datasets_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `environments_elements_list` — GET /api/environments/{environment_id}/elements/
- `environments_elements_create` — POST /api/environments/{environment_id}/elements/
- `environments_elements_retrieve` — GET /api/environments/{environment_id}/elements/{id}/
- `environments_elements_update` — PUT /api/environments/{environment_id}/elements/{id}/
- `environments_elements_partial_update` — PATCH /api/environments/{environment_id}/elements/{id}/
- `environments_elements_destroy` — DELETE /api/environments/{environment_id}/elements/{id}/
- `environments_elements_stats_retrieve` — The original version of this API always and only returned $autocapture elements
If no include query parameter is sent this remains true.
Now, you can pass a combination of include query parameters to get different types of elements
Currently only $autocapture and $rageclick and $dead_click are supported
- `environments_elements_values_retrieve` — GET /api/environments/{environment_id}/elements/values/
- `environments_endpoints_list` — List all endpoints for the team.
- `environments_endpoints_create` — Create a new endpoint.
- `environments_endpoints_retrieve` — Retrieve an endpoint, or a specific version via ?version=N.
- `environments_endpoints_update` — Update an existing endpoint. Parameters are optional. Pass version in body or ?version=N query param to target a specific version.
- `environments_endpoints_partial_update` — Update an existing endpoint.
- `environments_endpoints_destroy` — Delete an endpoint and clean up materialized query.
- `environments_endpoints_materialization_preview_create` — Preview the materialization transform for an endpoint. Shows what the query will look like after materialization, including range pair detection and bucket functions.
- `environments_endpoints_materialization_status_retrieve` — Get materialization status for an endpoint. Supports ?version=N query param.
- `environments_endpoints_openapi_spec_retrieve` — Get OpenAPI 3.0 specification for this endpoint. Use this to generate typed SDK clients.
- `environments_endpoints_run_retrieve` — Execute endpoint with optional materialization. Supports version parameter, runs latest version if not set.
- `environments_endpoints_run_create` — Execute endpoint with optional materialization. Supports version parameter, runs latest version if not set.
- `environments_endpoints_versions_list` — List all versions for an endpoint.
- `environments_endpoints_last_execution_times_create` — Get the last execution times in the past 6 months for multiple endpoints.
- `environments_error_tracking_releases_list` — GET /api/environments/{environment_id}/error_tracking/releases/
- `environments_error_tracking_releases_create` — POST /api/environments/{environment_id}/error_tracking/releases/
- `environments_error_tracking_releases_retrieve` — GET /api/environments/{environment_id}/error_tracking/releases/{id}/
- `environments_error_tracking_releases_update` — PUT /api/environments/{environment_id}/error_tracking/releases/{id}/
- `environments_error_tracking_releases_partial_update` — PATCH /api/environments/{environment_id}/error_tracking/releases/{id}/
- `environments_error_tracking_releases_destroy` — DELETE /api/environments/{environment_id}/error_tracking/releases/{id}/
- `environments_error_tracking_releases_hash_retrieve` — GET /api/environments/{environment_id}/error_tracking/releases/hash/{hash_id}/
- `environments_error_tracking_symbol_sets_list` — GET /api/environments/{environment_id}/error_tracking/symbol_sets/
- `environments_error_tracking_symbol_sets_retrieve` — GET /api/environments/{environment_id}/error_tracking/symbol_sets/{id}/
- `environments_error_tracking_symbol_sets_destroy` — DELETE /api/environments/{environment_id}/error_tracking/symbol_sets/{id}/
- `environments_error_tracking_symbol_sets_download_retrieve` — Return a presigned URL for downloading the symbol set's source map.
- `environments_error_tracking_symbol_sets_finish_upload_update` — PUT /api/environments/{environment_id}/error_tracking/symbol_sets/{id}/finish_upload/
- `environments_error_tracking_symbol_sets_bulk_delete_create` — POST /api/environments/{environment_id}/error_tracking/symbol_sets/bulk_delete/
- `environments_error_tracking_symbol_sets_bulk_finish_upload_create` — POST /api/environments/{environment_id}/error_tracking/symbol_sets/bulk_finish_upload/
- `environments_error_tracking_symbol_sets_bulk_start_upload_create` — POST /api/environments/{environment_id}/error_tracking/symbol_sets/bulk_start_upload/
- `environments_events_list` — 
        This endpoint allows you to list and filter events.
        It is effectively deprecated and is kept only for backwards compatibility.
        If you ever ask about it you will be advised to not use it...
        If you want to ad-hoc list or aggregate events, use the Query endpoint instead.
        If you want to export all events or many pages of events you should use our CDP/Batch Exports products instead.
        
- `environments_events_retrieve` — GET /api/environments/{environment_id}/events/{id}/
- `environments_events_values_retrieve` — GET /api/environments/{environment_id}/events/values/
- `environments_exports_list` — GET /api/environments/{environment_id}/exports/
- `environments_exports_create` — POST /api/environments/{environment_id}/exports/
- `environments_exports_retrieve` — GET /api/environments/{environment_id}/exports/{id}/
- `environments_exports_content_retrieve` — GET /api/environments/{environment_id}/exports/{id}/content/
- `environments_external_data_schemas_list` — GET /api/environments/{environment_id}/external_data_schemas/
- `environments_external_data_schemas_create` — POST /api/environments/{environment_id}/external_data_schemas/
- `environments_external_data_schemas_retrieve` — GET /api/environments/{environment_id}/external_data_schemas/{id}/
- `environments_external_data_schemas_update` — PUT /api/environments/{environment_id}/external_data_schemas/{id}/
- `environments_external_data_schemas_partial_update` — PATCH /api/environments/{environment_id}/external_data_schemas/{id}/
- `environments_external_data_schemas_destroy` — DELETE /api/environments/{environment_id}/external_data_schemas/{id}/
- `environments_external_data_schemas_cancel_create` — POST /api/environments/{environment_id}/external_data_schemas/{id}/cancel/
- `environments_external_data_schemas_delete_data_destroy` — DELETE /api/environments/{environment_id}/external_data_schemas/{id}/delete_data/
- `environments_external_data_schemas_incremental_fields_create` — POST /api/environments/{environment_id}/external_data_schemas/{id}/incremental_fields/
- `environments_external_data_schemas_reload_create` — POST /api/environments/{environment_id}/external_data_schemas/{id}/reload/
- `environments_external_data_schemas_resync_create` — POST /api/environments/{environment_id}/external_data_schemas/{id}/resync/
- `environments_external_data_sources_list` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_create` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_retrieve` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_update` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_partial_update` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_destroy` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_bulk_update_schemas_partial_update` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_create_webhook_create` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_delete_webhook_create` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_jobs_retrieve` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_refresh_schemas_create` — Fetch current schema/table list from the source and create any new ExternalDataSchema rows (no data sync).
- `environments_external_data_sources_reload_create` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_revenue_analytics_config_partial_update` — Update the revenue analytics configuration and return the full external data source.
- `environments_external_data_sources_update_webhook_inputs_create` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_webhook_info_retrieve` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_check_cdc_prerequisites_create` — Validate CDC prerequisites against a live Postgres connection.

Used by the source wizard to surface ✅/❌ checks before source creation,
and by the self-managed setup popup to verify user-created publications.
- `environments_external_data_sources_connections_list` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_database_schema_create` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_source_prefix_create` — Create, Read, Update and Delete External data Sources.
- `environments_external_data_sources_wizard_retrieve` — Create, Read, Update and Delete External data Sources.
- `environments_file_download_batch_exports_list` — GET /api/environments/{environment_id}/file_download_batch_exports/
- `environments_file_download_batch_exports_create` — Create and start a batch export on demand run to download a file.
- `environments_file_download_batch_exports_retrieve` — Get a batch export on demand run.

If the underlying batch export run has completed, we return keys to the
generated file downloads so that users may download them by making a request
to /download.
- `environments_file_download_batch_exports_cancel_create` — Cancel an ongoing file-download batch export.
- `environments_file_download_batch_exports_download_retrieve` — Download a file (or a part) from this batch export run.

Users can provide a part component with an id or index, or no part component at
all:
* If part id is included: The file download matching the id is downloaded.
* If part index is included: The file download matching the index (as ordered
    by key) is downloaded.
* If no part component is present: If there is only one file downloaded, that
    is downloaded. Otherwise the first one as sorted by key is downloaded.
- `environments_file_download_batch_exports_logs_retrieve` — GET /api/environments/{environment_id}/file_download_batch_exports/{id}/logs/
- `environments_file_system_list` — GET /api/environments/{environment_id}/file_system/
- `environments_file_system_create` — POST /api/environments/{environment_id}/file_system/
- `environments_file_system_retrieve` — GET /api/environments/{environment_id}/file_system/{id}/
- `environments_file_system_update` — PUT /api/environments/{environment_id}/file_system/{id}/
- `environments_file_system_partial_update` — PATCH /api/environments/{environment_id}/file_system/{id}/
- `environments_file_system_destroy` — DELETE /api/environments/{environment_id}/file_system/{id}/
- `environments_file_system_count_create` — Get count of all files in a folder.
- `environments_file_system_link_create` — POST /api/environments/{environment_id}/file_system/{id}/link/
- `environments_file_system_move_create` — POST /api/environments/{environment_id}/file_system/{id}/move/
- `environments_file_system_count_by_path_create` — Get count of all files in a folder.
- `environments_file_system_log_view_retrieve` — GET /api/environments/{environment_id}/file_system/log_view/
- `environments_file_system_log_view_create` — POST /api/environments/{environment_id}/file_system/log_view/
- `environments_file_system_undo_delete_create` — POST /api/environments/{environment_id}/file_system/undo_delete/
- `environments_file_system_unfiled_retrieve` — GET /api/environments/{environment_id}/file_system/unfiled/
- `environments_file_system_shortcut_list` — GET /api/environments/{environment_id}/file_system_shortcut/
- `environments_file_system_shortcut_create` — POST /api/environments/{environment_id}/file_system_shortcut/
- `environments_file_system_shortcut_retrieve` — GET /api/environments/{environment_id}/file_system_shortcut/{id}/
- `environments_file_system_shortcut_update` — PUT /api/environments/{environment_id}/file_system_shortcut/{id}/
- `environments_file_system_shortcut_partial_update` — PATCH /api/environments/{environment_id}/file_system_shortcut/{id}/
- `environments_file_system_shortcut_destroy` — DELETE /api/environments/{environment_id}/file_system_shortcut/{id}/
- `environments_file_system_shortcut_reorder_create` — Set the display order of the current user's shortcuts. `ordered_ids` becomes the new top-to-bottom order; any unknown IDs are rejected.
- `environments_groups_list` — List all groups of a specific group type. You must pass ?group_type_index= in the URL.
To get a list of valid group types, call /api/:project_id/groups_types/.

Uses forward-only keyset pagination via the `cursor` parameter.
The `previous` field in the response envelope is always null.
- `environments_groups_create` — POST /api/environments/{environment_id}/groups/
- `environments_groups_activity_retrieve` — GET /api/environments/{environment_id}/groups/activity/
- `environments_groups_delete_property_create` — POST /api/environments/{environment_id}/groups/delete_property/
- `environments_groups_find_retrieve` — GET /api/environments/{environment_id}/groups/find/
- `environments_groups_property_definitions_retrieve` — GET /api/environments/{environment_id}/groups/property_definitions/
- `environments_groups_property_values_retrieve` — GET /api/environments/{environment_id}/groups/property_values/
- `environments_groups_related_retrieve` — GET /api/environments/{environment_id}/groups/related/
- `environments_groups_update_property_create` — POST /api/environments/{environment_id}/groups/update_property/
- `environments_heatmap_screenshots_content_retrieve` — GET /api/environments/{environment_id}/heatmap_screenshots/{id}/content/
- `environments_heatmaps_list` — GET /api/environments/{environment_id}/heatmaps/
- `environments_heatmaps_events_retrieve` — GET /api/environments/{environment_id}/heatmaps/events/
- `environments_hog_flows_list` — GET /api/environments/{environment_id}/hog_flows/
- `environments_hog_flows_create` — POST /api/environments/{environment_id}/hog_flows/
- `environments_hog_flows_retrieve` — GET /api/environments/{environment_id}/hog_flows/{id}/
- `environments_hog_flows_update` — PUT /api/environments/{environment_id}/hog_flows/{id}/
- `environments_hog_flows_partial_update` — PATCH /api/environments/{environment_id}/hog_flows/{id}/
- `environments_hog_flows_destroy` — DELETE /api/environments/{environment_id}/hog_flows/{id}/
- `environments_hog_flows_batch_jobs_retrieve` — GET /api/environments/{environment_id}/hog_flows/{id}/batch_jobs/
- `environments_hog_flows_batch_jobs_create` — POST /api/environments/{environment_id}/hog_flows/{id}/batch_jobs/
- `environments_hog_flows_invocations_create` — POST /api/environments/{environment_id}/hog_flows/{id}/invocations/
- `environments_hog_flows_logs_retrieve` — GET /api/environments/{environment_id}/hog_flows/{id}/logs/
- `environments_hog_flows_metrics_retrieve` — GET /api/environments/{environment_id}/hog_flows/{id}/metrics/
- `environments_hog_flows_metrics_totals_retrieve` — GET /api/environments/{environment_id}/hog_flows/{id}/metrics/totals/
- `environments_hog_flows_schedules_list` — GET /api/environments/{environment_id}/hog_flows/{id}/schedules/
- `environments_hog_flows_schedules_create` — POST /api/environments/{environment_id}/hog_flows/{id}/schedules/
- `environments_hog_flows_schedules_partial_update` — PATCH /api/environments/{environment_id}/hog_flows/{id}/schedules/{schedule_id}/
- `environments_hog_flows_schedules_destroy` — DELETE /api/environments/{environment_id}/hog_flows/{id}/schedules/{schedule_id}/
- `environments_hog_flows_bulk_delete_create` — POST /api/environments/{environment_id}/hog_flows/bulk_delete/
- `environments_hog_flows_user_blast_radius_create` — POST /api/environments/{environment_id}/hog_flows/user_blast_radius/
- `environments_hog_functions_list` — GET /api/environments/{environment_id}/hog_functions/
- `environments_hog_functions_create` — POST /api/environments/{environment_id}/hog_functions/
- `environments_hog_functions_retrieve` — GET /api/environments/{environment_id}/hog_functions/{id}/
- `environments_hog_functions_update` — PUT /api/environments/{environment_id}/hog_functions/{id}/
- `environments_hog_functions_partial_update` — PATCH /api/environments/{environment_id}/hog_functions/{id}/
- `environments_hog_functions_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `environments_hog_functions_enable_backfills_create` — POST /api/environments/{environment_id}/hog_functions/{id}/enable_backfills/
- `environments_hog_functions_invocations_create` — POST /api/environments/{environment_id}/hog_functions/{id}/invocations/
- `environments_hog_functions_logs_retrieve` — GET /api/environments/{environment_id}/hog_functions/{id}/logs/
- `environments_hog_functions_metrics_retrieve` — GET /api/environments/{environment_id}/hog_functions/{id}/metrics/
- `environments_hog_functions_metrics_totals_retrieve` — GET /api/environments/{environment_id}/hog_functions/{id}/metrics/totals/
- `environments_hog_functions_icon_retrieve` — GET /api/environments/{environment_id}/hog_functions/icon/
- `environments_hog_functions_icons_retrieve` — GET /api/environments/{environment_id}/hog_functions/icons/
- `environments_hog_functions_rearrange_partial_update` — Update the execution order of multiple HogFunctions.
- `environments_insight_variables_list` — GET /api/environments/{environment_id}/insight_variables/
- `environments_insight_variables_create` — POST /api/environments/{environment_id}/insight_variables/
- `environments_insight_variables_retrieve` — GET /api/environments/{environment_id}/insight_variables/{id}/
- `environments_insight_variables_update` — PUT /api/environments/{environment_id}/insight_variables/{id}/
- `environments_insight_variables_partial_update` — PATCH /api/environments/{environment_id}/insight_variables/{id}/
- `environments_insight_variables_destroy` — DELETE /api/environments/{environment_id}/insight_variables/{id}/
- `environments_insights_list` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `environments_insights_create` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `environments_insights_sharing_list` — GET /api/environments/{environment_id}/insights/{insight_id}/sharing/
- `environments_insights_sharing_passwords_create` — Create a new password for the sharing configuration.
- `environments_insights_sharing_passwords_destroy` — Delete a password from the sharing configuration.
- `environments_insights_sharing_refresh_create` — POST /api/environments/{environment_id}/insights/{insight_id}/sharing/refresh/
- `environments_insights_thresholds_list` — GET /api/environments/{environment_id}/insights/{insight_id}/thresholds/
- `environments_insights_thresholds_retrieve` — GET /api/environments/{environment_id}/insights/{insight_id}/thresholds/{id}/
- `environments_insights_retrieve` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `environments_insights_update` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `environments_insights_partial_update` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `environments_insights_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `environments_insights_activity_retrieve` — Audit trail for a single insight — every change made to it, by whom, and when. Use this when you want the change history of a specific insight; use the project-wide activity endpoint for a broader view.
- `environments_insights_analyze_retrieve` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `environments_insights_suggestions_retrieve` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `environments_insights_suggestions_create` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `environments_insights_all_activity_retrieve` — Project-wide audit trail across all insights — who created, edited, deleted, or restored insights, what changed (with before/after diffs), and when. Useful for surfacing what people (or agents) have been working on recently.
- `environments_insights_bulk_update_tags_create` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `environments_insights_cancel_create` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `environments_insights_generate_metadata_create` — Generate an AI-suggested name and description for an insight based on its query configuration.
- `environments_insights_my_last_viewed_retrieve` — Returns basic details about the last 5 insights viewed by this user. Most recently viewed first.
- `environments_insights_trending_retrieve` — Returns insights ranked by view count over the last N days (default 7), highest first. Each result includes the same metadata as the standard insights list, plus a `view_count` and up to 3 recent `viewers`. Useful for surfacing the most-used insights in a project.
- `environments_insights_viewed_create` — Record that the current user has just viewed one or more insights. Submitted ids that do not belong to the current project or that point at deleted insights are silently dropped. Returns 201 on success regardless of how many ids were retained.
- `environments_integrations_list` — GET /api/environments/{environment_id}/integrations/
- `environments_integrations_create` — POST /api/environments/{environment_id}/integrations/
- `environments_integrations_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/
- `environments_integrations_destroy` — DELETE /api/environments/{environment_id}/integrations/{id}/
- `environments_integrations_anthropic_managed_agent_envs_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/anthropic_managed_agent_environments/
- `environments_integrations_anthropic_managed_agent_vaults_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/anthropic_managed_agent_vaults/
- `environments_integrations_anthropic_managed_agents_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/anthropic_managed_agents/
- `environments_integrations_channels_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/channels/
- `environments_integrations_clickup_lists_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/clickup_lists/
- `environments_integrations_clickup_spaces_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/clickup_spaces/
- `environments_integrations_clickup_workspaces_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/clickup_workspaces/
- `environments_integrations_email_partial_update` — PATCH /api/environments/{environment_id}/integrations/{id}/email/
- `environments_integrations_email_verify_create` — POST /api/environments/{environment_id}/integrations/{id}/email/verify/
- `environments_integrations_github_branches_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/github_branches/
- `environments_integrations_github_repos_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/github_repos/
- `environments_integrations_github_repos_refresh_create` — POST /api/environments/{environment_id}/integrations/{id}/github_repos/refresh/
- `environments_integrations_github_teams_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/github_teams/
- `environments_integrations_google_accessible_accounts_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/google_accessible_accounts/
- `environments_integrations_google_conversion_actions_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/google_conversion_actions/
- `environments_integrations_jira_projects_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/jira_projects/
- `environments_integrations_linear_teams_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/linear_teams/
- `environments_integrations_linkedin_ads_accounts_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/linkedin_ads_accounts/
- `environments_integrations_linkedin_ads_conversion_rules_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/linkedin_ads_conversion_rules/
- `environments_integrations_twilio_phone_numbers_retrieve` — GET /api/environments/{environment_id}/integrations/{id}/twilio_phone_numbers/
- `environments_integrations_authorize_retrieve` — GET /api/environments/{environment_id}/integrations/authorize/
- `environments_integrations_domain_connect_apply_url_create` — Unified endpoint for generating Domain Connect apply URLs.

Accepts a context ("email" or "proxy") and the relevant resource ID.
The backend resolves the domain, template variables, and service ID
based on context, then builds the signed apply URL.
- `environments_integrations_domain_connect_check_retrieve` — GET /api/environments/{environment_id}/integrations/domain-connect/check/
- `environments_integrations_github_link_existing_create` — Reuse a GitHub installation already linked to a sibling team in the same organization.
- `environments_integrations_github_oauth_authorize_create` — Mint a User OAuth URL to bootstrap a fresh `code` when the install flow returns without one.
- `environments_logs_alerts_list` — GET /api/environments/{environment_id}/logs/alerts/
- `environments_logs_alerts_create` — POST /api/environments/{environment_id}/logs/alerts/
- `environments_logs_alerts_retrieve` — GET /api/environments/{environment_id}/logs/alerts/{id}/
- `environments_logs_alerts_update` — PUT /api/environments/{environment_id}/logs/alerts/{id}/
- `environments_logs_alerts_partial_update` — PATCH /api/environments/{environment_id}/logs/alerts/{id}/
- `environments_logs_alerts_destroy` — DELETE /api/environments/{environment_id}/logs/alerts/{id}/
- `environments_logs_alerts_destinations_create` — Create a notification destination for this alert. One HogFunction is created per alert event kind (firing, resolved, ...) atomically.
- `environments_logs_alerts_destinations_delete_create` — Delete a notification destination by deleting its HogFunction group atomically.
- `environments_logs_alerts_events_list` — Paginated event history for this alert, newest first. Returns state transitions, errored checks, and user-initiated control-plane rows (reset, enable/disable, snooze/unsnooze, threshold change) — quiet no-op check rows (where state didn't change and there was no error) are filtered out since only the last 10 are kept and they carry no forensic value. Optional `?kind=...` narrows to a single kind.
- `environments_logs_alerts_reset_create` — Reset a broken alert. Clears the consecutive-failure counter and schedules an immediate recheck.
- `environments_logs_alerts_simulate_create` — Simulate a logs alert on historical data using the full state machine. Read-only — no alert check records are created.
- `environments_logs_attributes_retrieve` — GET /api/environments/{environment_id}/logs/attributes/
- `environments_logs_count_create` — POST /api/environments/{environment_id}/logs/count/
- `environments_logs_count_ranges_create` — POST /api/environments/{environment_id}/logs/count-ranges/
- `environments_logs_export_create` — POST /api/environments/{environment_id}/logs/export/
- `environments_logs_has_logs_retrieve` — GET /api/environments/{environment_id}/logs/has_logs/
- `environments_logs_query_create` — POST /api/environments/{environment_id}/logs/query/
- `environments_logs_sampling_rules_list` — GET /api/environments/{environment_id}/logs/sampling_rules/
- `environments_logs_sampling_rules_create` — POST /api/environments/{environment_id}/logs/sampling_rules/
- `environments_logs_sampling_rules_retrieve` — GET /api/environments/{environment_id}/logs/sampling_rules/{id}/
- `environments_logs_sampling_rules_update` — PUT /api/environments/{environment_id}/logs/sampling_rules/{id}/
- `environments_logs_sampling_rules_partial_update` — PATCH /api/environments/{environment_id}/logs/sampling_rules/{id}/
- `environments_logs_sampling_rules_destroy` — DELETE /api/environments/{environment_id}/logs/sampling_rules/{id}/
- `environments_logs_sampling_rules_simulate_create` — Dry-run estimate for how much volume this rule would remove (placeholder response until CH-backed simulation is wired).
- `environments_logs_sampling_rules_reorder_create` — Atomically reassign priorities so the given ID order maps to ascending priorities (0..n-1).
- `environments_logs_services_create` — POST /api/environments/{environment_id}/logs/services/
- `environments_logs_sparkline_create` — POST /api/environments/{environment_id}/logs/sparkline/
- `environments_logs_values_retrieve` — GET /api/environments/{environment_id}/logs/values/
- `environments_metrics_has_metrics_retrieve` — GET /api/environments/{environment_id}/metrics/has_metrics/
- `environments_metrics_query_create` — POST /api/environments/{environment_id}/metrics/query/
- `environments_metrics_values_retrieve` — Distinct metric names for the team. Backs the picker UI.
- `environments_persisted_folder_list` — GET /api/environments/{environment_id}/persisted_folder/
- `environments_persisted_folder_create` — POST /api/environments/{environment_id}/persisted_folder/
- `environments_persisted_folder_retrieve` — GET /api/environments/{environment_id}/persisted_folder/{id}/
- `environments_persisted_folder_update` — PUT /api/environments/{environment_id}/persisted_folder/{id}/
- `environments_persisted_folder_partial_update` — PATCH /api/environments/{environment_id}/persisted_folder/{id}/
- `environments_persisted_folder_destroy` — DELETE /api/environments/{environment_id}/persisted_folder/{id}/
- `environments_persons_list` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_update` — Only for setting properties on the person. "properties" from the request data will be updated via a "$set" event.
This means that only the properties listed will be updated, but other properties won't be removed nor updated.
If you would like to remove a property use the `delete_property` endpoint.
- `environments_persons_partial_update` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_activity_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_delete_property_create` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_properties_timeline_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_split_create` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_update_property_create` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_all_activity_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_batch_by_distinct_ids_create` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_batch_by_uuids_create` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_bulk_delete_create` — This endpoint allows you to bulk delete persons, either by the PostHog person IDs or by distinct IDs. You can pass in a maximum of 1000 IDs per call. Only events captured before the request will be deleted.
- `environments_persons_cohorts_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_deletion_status_list` — List the status of queued event deletions for persons. When you delete a person with `delete_events=true`, an async deletion is queued. Use this endpoint to check whether those deletions are still pending or have been completed.
- `environments_persons_funnel_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_funnel_create` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_funnel_correlation_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_funnel_correlation_create` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_lifecycle_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_properties_at_time_retrieve` — Get person properties as they existed at a specific point in time.

This endpoint reconstructs person properties by querying ClickHouse events
for $set and $set_once operations up to the specified timestamp.

Query parameters:
- distinct_id: The distinct_id of the person
- timestamp: ISO datetime string for the point in time (e.g., "2023-06-15T14:30:00Z")
- include_set_once: Whether to handle $set_once operations (default: false)
- `environments_persons_reset_person_distinct_id_create` — Reset a distinct_id for a deleted person. This allows the distinct_id to be used again.
- `environments_persons_trends_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_persons_values_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `environments_plugin_configs_logs_list` — GET /api/environments/{environment_id}/plugin_configs/{plugin_config_id}/logs/
- `environments_project_secret_api_keys_list` — GET /api/environments/{environment_id}/project_secret_api_keys/
- `environments_project_secret_api_keys_create` — POST /api/environments/{environment_id}/project_secret_api_keys/
- `environments_project_secret_api_keys_retrieve` — GET /api/environments/{environment_id}/project_secret_api_keys/{id}/
- `environments_project_secret_api_keys_update` — PUT /api/environments/{environment_id}/project_secret_api_keys/{id}/
- `environments_project_secret_api_keys_partial_update` — PATCH /api/environments/{environment_id}/project_secret_api_keys/{id}/
- `environments_project_secret_api_keys_destroy` — DELETE /api/environments/{environment_id}/project_secret_api_keys/{id}/
- `environments_project_secret_api_keys_roll_create` — Roll a project secret API key
- `environments_query_create` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `environments_query_retrieve` — (Experimental)
- `environments_query_destroy` — (Experimental)
- `environments_query_log_retrieve` — Get query log details from query_log_archive table for a specific query_id, the query must have been issued in last 24 hours.
- `environments_query_create_with_kind` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `environments_query_check_auth_for_async_create` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `environments_query_draft_sql_retrieve` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `environments_query_upgrade_create` — Upgrades a query without executing it. Returns a query with all nodes migrated to the latest version.
- `environments_saved_list` — GET /api/environments/{environment_id}/saved/
- `environments_saved_create` — POST /api/environments/{environment_id}/saved/
- `environments_saved_retrieve` — GET /api/environments/{environment_id}/saved/{short_id}/
- `environments_saved_partial_update` — PATCH /api/environments/{environment_id}/saved/{short_id}/
- `environments_saved_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `environments_saved_regenerate_create` — POST /api/environments/{environment_id}/saved/{short_id}/regenerate/
- `environments_session_recording_playlists_list` — Override list to include synthetic playlists
- `environments_session_recording_playlists_create` — POST /api/environments/{environment_id}/session_recording_playlists/
- `environments_session_recording_playlists_retrieve` — GET /api/environments/{environment_id}/session_recording_playlists/{short_id}/
- `environments_session_recording_playlists_update` — PUT /api/environments/{environment_id}/session_recording_playlists/{short_id}/
- `environments_session_recording_playlists_partial_update` — PATCH /api/environments/{environment_id}/session_recording_playlists/{short_id}/
- `environments_session_recording_playlists_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `environments_session_recording_playlists_recordings_retrieve` — GET /api/environments/{environment_id}/session_recording_playlists/{short_id}/recordings/
- `environments_session_recording_playlists_recordings_create` — POST /api/environments/{environment_id}/session_recording_playlists/{short_id}/recordings/{session_recording_id}/
- `environments_session_recording_playlists_recordings_destroy` — DELETE /api/environments/{environment_id}/session_recording_playlists/{short_id}/recordings/{session_recording_id}/
- `environments_session_recordings_list` — GET /api/environments/{environment_id}/session_recordings/
- `environments_session_recordings_retrieve` — GET /api/environments/{environment_id}/session_recordings/{id}/
- `environments_session_recordings_update` — PUT /api/environments/{environment_id}/session_recordings/{id}/
- `environments_session_recordings_partial_update` — PATCH /api/environments/{environment_id}/session_recordings/{id}/
- `environments_session_recordings_destroy` — DELETE /api/environments/{environment_id}/session_recordings/{id}/
- `environments_session_recordings_sharing_list` — GET /api/environments/{environment_id}/session_recordings/{recording_id}/sharing/
- `environments_session_recordings_sharing_passwords_create` — Create a new password for the sharing configuration.
- `environments_session_recordings_sharing_passwords_destroy` — Delete a password from the sharing configuration.
- `environments_session_recordings_sharing_refresh_create` — POST /api/environments/{environment_id}/session_recordings/{recording_id}/sharing/refresh/
- `environments_sessions_property_definitions_retrieve` — GET /api/environments/{environment_id}/sessions/property_definitions/
- `environments_sessions_values_retrieve` — GET /api/environments/{environment_id}/sessions/values/
- `environments_subscriptions_list` — GET /api/environments/{environment_id}/subscriptions/
- `environments_subscriptions_create` — POST /api/environments/{environment_id}/subscriptions/
- `environments_subscriptions_retrieve` — GET /api/environments/{environment_id}/subscriptions/{id}/
- `environments_subscriptions_update` — PUT /api/environments/{environment_id}/subscriptions/{id}/
- `environments_subscriptions_partial_update` — PATCH /api/environments/{environment_id}/subscriptions/{id}/
- `environments_subscriptions_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `environments_subscriptions_test_delivery_create` — POST /api/environments/{environment_id}/subscriptions/{id}/test-delivery/
- `environments_subscriptions_summary_quota_retrieve` — GET /api/environments/{environment_id}/subscriptions/summary_quota/
- `environments_warehouse_saved_queries_list` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_saved_queries_create` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_saved_queries_retrieve` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_saved_queries_update` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_saved_queries_partial_update` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_saved_queries_destroy` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_saved_queries_activity_retrieve` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_saved_queries_ancestors_create` — Return the ancestors of this saved query.

By default, we return the immediate parents. The `level` parameter can be used to
look further back into the ancestor tree. If `level` overshoots (i.e. points to only
ancestors beyond the root), we return an empty list.
- `environments_warehouse_saved_queries_cancel_create` — Cancel a running saved query workflow.
- `environments_warehouse_saved_queries_dependencies_retrieve` — Return the count of immediate upstream and downstream dependencies for this saved query.
- `environments_warehouse_saved_queries_descendants_create` — Return the descendants of this saved query.

By default, we return the immediate children. The `level` parameter can be used to
look further ahead into the descendants tree. If `level` overshoots (i.e. points to only
descendants further than a leaf), we return an empty list.
- `environments_warehouse_saved_queries_materialize_create` — Enable materialization for this saved query with a 24-hour sync frequency.
- `environments_warehouse_saved_queries_revert_materialization_create` — Undo materialization, revert back to the original view.
(i.e. delete the materialized table and the schedule)
- `environments_warehouse_saved_queries_run_create` — Run this saved query.
- `environments_warehouse_saved_queries_run_history_retrieve` — Return the recent run history (up to 5 most recent) for this materialized view.
- `environments_warehouse_saved_queries_resume_schedules_create` — Resume paused materialization schedules for multiple matviews.

Accepts a list of view IDs in the request body: {"view_ids": ["id1", "id2", ...]}
This endpoint is idempotent - calling it on already running or non-existent schedules is safe.
- `environments_warehouse_saved_query_folders_list` — GET /api/environments/{environment_id}/warehouse_saved_query_folders/
- `environments_warehouse_saved_query_folders_create` — POST /api/environments/{environment_id}/warehouse_saved_query_folders/
- `environments_warehouse_saved_query_folders_retrieve` — GET /api/environments/{environment_id}/warehouse_saved_query_folders/{id}/
- `environments_warehouse_saved_query_folders_partial_update` — PATCH /api/environments/{environment_id}/warehouse_saved_query_folders/{id}/
- `environments_warehouse_saved_query_folders_destroy` — DELETE /api/environments/{environment_id}/warehouse_saved_query_folders/{id}/
- `environments_warehouse_tables_list` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_tables_create` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_tables_retrieve` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_tables_update` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_tables_partial_update` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_tables_destroy` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_tables_refresh_schema_create` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_tables_update_schema_create` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_tables_file_create` — Create, Read, Update and Delete Warehouse Tables.
- `environments_warehouse_view_link_list` — Create, Read, Update and Delete View Columns.
- `environments_warehouse_view_link_create` — Create, Read, Update and Delete View Columns.
- `environments_warehouse_view_link_retrieve` — Create, Read, Update and Delete View Columns.
- `environments_warehouse_view_link_update` — Create, Read, Update and Delete View Columns.
- `environments_warehouse_view_link_partial_update` — Create, Read, Update and Delete View Columns.
- `environments_warehouse_view_link_destroy` — Create, Read, Update and Delete View Columns.
- `environments_warehouse_view_link_validate_create` — Create, Read, Update and Delete View Columns.
- `environments_warehouse_view_links_list` — Create, Read, Update and Delete View Columns.
- `environments_warehouse_view_links_create` — Create, Read, Update and Delete View Columns.
- `environments_warehouse_view_links_retrieve` — Create, Read, Update and Delete View Columns.
- `environments_warehouse_view_links_update` — Create, Read, Update and Delete View Columns.
- `environments_warehouse_view_links_partial_update` — Create, Read, Update and Delete View Columns.
- `environments_warehouse_view_links_destroy` — Create, Read, Update and Delete View Columns.
- `environments_warehouse_view_links_validate_create` — Create, Read, Update and Delete View Columns.
- `accounts_list` — GET /api/environments/{project_id}/accounts/
- `accounts_create` — POST /api/environments/{project_id}/accounts/
- `accounts_notebooks_list` — GET /api/environments/{project_id}/accounts/{account_id}/notebooks/
- `accounts_notebooks_create` — POST /api/environments/{project_id}/accounts/{account_id}/notebooks/
- `accounts_notebooks_retrieve` — GET /api/environments/{project_id}/accounts/{account_id}/notebooks/{short_id}/
- `accounts_notebooks_destroy` — DELETE /api/environments/{project_id}/accounts/{account_id}/notebooks/{short_id}/
- `accounts_retrieve` — GET /api/environments/{project_id}/accounts/{id}/
- `accounts_update` — PUT /api/environments/{project_id}/accounts/{id}/
- `accounts_partial_update` — PATCH /api/environments/{project_id}/accounts/{id}/
- `accounts_destroy` — DELETE /api/environments/{project_id}/accounts/{id}/
- `approval_policies_list` — GET /api/environments/{project_id}/approval_policies/
- `approval_policies_create` — POST /api/environments/{project_id}/approval_policies/
- `approval_policies_retrieve` — GET /api/environments/{project_id}/approval_policies/{id}/
- `approval_policies_update` — PUT /api/environments/{project_id}/approval_policies/{id}/
- `approval_policies_partial_update` — PATCH /api/environments/{project_id}/approval_policies/{id}/
- `approval_policies_destroy` — DELETE /api/environments/{project_id}/approval_policies/{id}/
- `change_requests_list` — GET /api/environments/{project_id}/change_requests/
- `change_requests_retrieve` — GET /api/environments/{project_id}/change_requests/{id}/
- `change_requests_approve_create` — Approve a change request.
If quorum is reached, automatically applies the change immediately.
- `change_requests_cancel_create` — Cancel a change request.
Only the requester can cancel their own pending change request.
- `change_requests_reject_create` — Reject a change request.
- `conversations_list` — GET /api/environments/{project_id}/conversations/
- `conversations_create` — Unified endpoint that handles both conversation creation and streaming.

- If message is provided: Start new conversation processing
- If no message: Stream from existing conversation
- `conversations_retrieve` — GET /api/environments/{project_id}/conversations/{conversation}/
- `conversations_destroy` — Delete a conversation.
- `conversations_append_message_create` — Appends a message to an existing conversation without triggering AI processing.
This is used for client-side generated messages that need to be persisted
(e.g., support ticket confirmation messages).
- `conversations_cancel_partial_update` — PATCH /api/environments/{project_id}/conversations/{conversation}/cancel/
- `conversations_queue_retrieve` — GET /api/environments/{project_id}/conversations/{conversation}/queue/
- `conversations_queue_create` — POST /api/environments/{project_id}/conversations/{conversation}/queue/
- `conversations_queue_partial_update` — PATCH /api/environments/{project_id}/conversations/{conversation}/queue/{queue_id}/
- `conversations_queue_destroy` — DELETE /api/environments/{project_id}/conversations/{conversation}/queue/{queue_id}/
- `conversations_queue_clear_create` — POST /api/environments/{project_id}/conversations/{conversation}/queue/clear/
- `conversations_views_list` — GET /api/environments/{project_id}/conversations/views/
- `conversations_views_create` — POST /api/environments/{project_id}/conversations/views/
- `conversations_views_retrieve` — GET /api/environments/{project_id}/conversations/views/{short_id}/
- `conversations_views_destroy` — DELETE /api/environments/{project_id}/conversations/views/{short_id}/
- `customer_journeys_list` — GET /api/environments/{project_id}/customer_journeys/
- `customer_journeys_create` — POST /api/environments/{project_id}/customer_journeys/
- `customer_journeys_retrieve` — GET /api/environments/{project_id}/customer_journeys/{id}/
- `customer_journeys_update` — PUT /api/environments/{project_id}/customer_journeys/{id}/
- `customer_journeys_partial_update` — PATCH /api/environments/{project_id}/customer_journeys/{id}/
- `customer_journeys_destroy` — DELETE /api/environments/{project_id}/customer_journeys/{id}/
- `customer_profile_configs_list` — GET /api/environments/{project_id}/customer_profile_configs/
- `customer_profile_configs_create` — POST /api/environments/{project_id}/customer_profile_configs/
- `customer_profile_configs_retrieve` — GET /api/environments/{project_id}/customer_profile_configs/{id}/
- `customer_profile_configs_update` — PUT /api/environments/{project_id}/customer_profile_configs/{id}/
- `customer_profile_configs_partial_update` — PATCH /api/environments/{project_id}/customer_profile_configs/{id}/
- `customer_profile_configs_destroy` — DELETE /api/environments/{project_id}/customer_profile_configs/{id}/
- `desktop_recordings_list` — RESTful API for managing desktop meeting recordings.

Standard CRUD operations plus transcript management as a subresource.
- `desktop_recordings_create` — Create a new recording and get Recall.ai upload token for the desktop SDK
- `desktop_recordings_retrieve` — RESTful API for managing desktop meeting recordings.

Standard CRUD operations plus transcript management as a subresource.
- `desktop_recordings_update` — RESTful API for managing desktop meeting recordings.

Standard CRUD operations plus transcript management as a subresource.
- `desktop_recordings_partial_update` — RESTful API for managing desktop meeting recordings.

Standard CRUD operations plus transcript management as a subresource.
- `desktop_recordings_destroy` — RESTful API for managing desktop meeting recordings.

Standard CRUD operations plus transcript management as a subresource.
- `desktop_recordings_append_segments_create` — Append transcript segments (supports batched real-time streaming)
- `error_tracking_assignment_rules_list` — GET /api/environments/{project_id}/error_tracking/assignment_rules/
- `error_tracking_assignment_rules_create` — POST /api/environments/{project_id}/error_tracking/assignment_rules/
- `error_tracking_assignment_rules_retrieve` — GET /api/environments/{project_id}/error_tracking/assignment_rules/{id}/
- `error_tracking_assignment_rules_update` — PUT /api/environments/{project_id}/error_tracking/assignment_rules/{id}/
- `error_tracking_assignment_rules_partial_update` — PATCH /api/environments/{project_id}/error_tracking/assignment_rules/{id}/
- `error_tracking_assignment_rules_destroy` — DELETE /api/environments/{project_id}/error_tracking/assignment_rules/{id}/
- `error_tracking_assignment_rules_reorder_partial_update` — PATCH /api/environments/{project_id}/error_tracking/assignment_rules/reorder/
- `error_tracking_fingerprints_list` — GET /api/environments/{project_id}/error_tracking/fingerprints/
- `error_tracking_fingerprints_retrieve` — GET /api/environments/{project_id}/error_tracking/fingerprints/{id}/
- `error_tracking_fingerprints_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `error_tracking_git_provider_file_links_resolve_github_retrieve` — GET /api/environments/{project_id}/error_tracking/git-provider-file-links/resolve_github/
- `error_tracking_git_provider_file_links_resolve_gitlab_retrieve` — GET /api/environments/{project_id}/error_tracking/git-provider-file-links/resolve_gitlab/
- `error_tracking_grouping_rules_list` — GET /api/environments/{project_id}/error_tracking/grouping_rules/
- `error_tracking_grouping_rules_create` — POST /api/environments/{project_id}/error_tracking/grouping_rules/
- `error_tracking_grouping_rules_retrieve` — GET /api/environments/{project_id}/error_tracking/grouping_rules/{id}/
- `error_tracking_grouping_rules_update` — PUT /api/environments/{project_id}/error_tracking/grouping_rules/{id}/
- `error_tracking_grouping_rules_partial_update` — PATCH /api/environments/{project_id}/error_tracking/grouping_rules/{id}/
- `error_tracking_grouping_rules_destroy` — DELETE /api/environments/{project_id}/error_tracking/grouping_rules/{id}/
- `error_tracking_grouping_rules_reorder_partial_update` — PATCH /api/environments/{project_id}/error_tracking/grouping_rules/reorder/
- `error_tracking_issues_list` — GET /api/environments/{project_id}/error_tracking/issues/
- `error_tracking_issues_create` — POST /api/environments/{project_id}/error_tracking/issues/
- `error_tracking_issues_retrieve` — GET /api/environments/{project_id}/error_tracking/issues/{id}/
- `error_tracking_issues_update` — PUT /api/environments/{project_id}/error_tracking/issues/{id}/
- `error_tracking_issues_partial_update` — PATCH /api/environments/{project_id}/error_tracking/issues/{id}/
- `error_tracking_issues_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `error_tracking_issues_activity_retrieve` — GET /api/environments/{project_id}/error_tracking/issues/{id}/activity/
- `error_tracking_issues_assign_partial_update` — PATCH /api/environments/{project_id}/error_tracking/issues/{id}/assign/
- `error_tracking_issues_cohort_update` — PUT /api/environments/{project_id}/error_tracking/issues/{id}/cohort/
- `error_tracking_issues_merge_create` — POST /api/environments/{project_id}/error_tracking/issues/{id}/merge/
- `error_tracking_issues_split_create` — POST /api/environments/{project_id}/error_tracking/issues/{id}/split/
- `error_tracking_issues_all_activity_retrieve` — GET /api/environments/{project_id}/error_tracking/issues/activity/
- `error_tracking_issues_bulk_create` — POST /api/environments/{project_id}/error_tracking/issues/bulk/
- `error_tracking_issues_exists_retrieve` — GET /api/environments/{project_id}/error_tracking/issues/exists/
- `error_tracking_issues_values_retrieve` — GET /api/environments/{project_id}/error_tracking/issues/values/
- `error_tracking_query_issue_create` — Get compact error tracking issue details
- `error_tracking_query_issue_events_create` — List sampled exception events for an error tracking issue
- `error_tracking_query_issues_list_create` — List compact error tracking issues
- `error_tracking_recommendations_list` — GET /api/environments/{project_id}/error_tracking/recommendations/
- `error_tracking_recommendations_dismiss_create` — POST /api/environments/{project_id}/error_tracking/recommendations/{id}/dismiss/
- `error_tracking_recommendations_refresh_create` — POST /api/environments/{project_id}/error_tracking/recommendations/{id}/refresh/
- `error_tracking_recommendations_restore_create` — POST /api/environments/{project_id}/error_tracking/recommendations/{id}/restore/
- `error_tracking_settings_retrieve_settings_retrieve` — GET /api/environments/{project_id}/error_tracking/settings/retrieve_settings/
- `error_tracking_settings_update_settings_partial_update` — PATCH /api/environments/{project_id}/error_tracking/settings/update_settings/
- `error_tracking_spike_detection_config_list` — GET /api/environments/{project_id}/error_tracking/spike_detection_config/
- `error_tracking_spike_detection_config_update_config_partial_update` — PATCH /api/environments/{project_id}/error_tracking/spike_detection_config/update_config/
- `error_tracking_spike_events_list` — GET /api/environments/{project_id}/error_tracking/spike_events/
- `error_tracking_stack_frames_list` — GET /api/environments/{project_id}/error_tracking/stack_frames/
- `error_tracking_stack_frames_retrieve` — GET /api/environments/{project_id}/error_tracking/stack_frames/{id}/
- `error_tracking_stack_frames_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `error_tracking_stack_frames_batch_get_create` — POST /api/environments/{project_id}/error_tracking/stack_frames/batch_get/
- `error_tracking_suppression_rules_list` — GET /api/environments/{project_id}/error_tracking/suppression_rules/
- `error_tracking_suppression_rules_create` — POST /api/environments/{project_id}/error_tracking/suppression_rules/
- `error_tracking_suppression_rules_retrieve` — GET /api/environments/{project_id}/error_tracking/suppression_rules/{id}/
- `error_tracking_suppression_rules_update` — PUT /api/environments/{project_id}/error_tracking/suppression_rules/{id}/
- `error_tracking_suppression_rules_partial_update` — PATCH /api/environments/{project_id}/error_tracking/suppression_rules/{id}/
- `error_tracking_suppression_rules_destroy` — DELETE /api/environments/{project_id}/error_tracking/suppression_rules/{id}/
- `error_tracking_suppression_rules_reorder_partial_update` — PATCH /api/environments/{project_id}/error_tracking/suppression_rules/reorder/
- `evaluation_runs_create` — Create a new evaluation run.

This endpoint validates the request and enqueues a Temporal workflow
to asynchronously execute the evaluation.
- `evaluations_list` — GET /api/environments/{project_id}/evaluations/
- `evaluations_create` — POST /api/environments/{project_id}/evaluations/
- `evaluations_retrieve` — GET /api/environments/{project_id}/evaluations/{id}/
- `evaluations_update` — PUT /api/environments/{project_id}/evaluations/{id}/
- `evaluations_partial_update` — PATCH /api/environments/{project_id}/evaluations/{id}/
- `evaluations_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `evaluations_test_hog_create` — Test Hog evaluation code against sample events without saving.
- `event_filter_retrieve` — Returns the event filter config for the team, or null if not yet created.
- `event_filter_create` — Create or update the event filter config.
- `event_filter_metrics_retrieve` — Single event filter per team.
GET  /event_filter/ — returns the config (or null if not yet created)
POST /event_filter/ — creates or updates the config (upsert)
GET  /event_filter/metrics/ — time-series metrics
GET  /event_filter/metrics/totals/ — aggregate totals
- `event_filter_metrics_totals_retrieve` — Single event filter per team.
GET  /event_filter/ — returns the config (or null if not yet created)
POST /event_filter/ — creates or updates the config (upsert)
GET  /event_filter/metrics/ — time-series metrics
GET  /event_filter/metrics/totals/ — aggregate totals
- `health_issues_list` — GET /api/environments/{project_id}/health_issues/
- `health_issues_retrieve` — GET /api/environments/{project_id}/health_issues/{id}/
- `health_issues_partial_update` — PATCH /api/environments/{project_id}/health_issues/{id}/
- `health_issues_resolve_create` — POST /api/environments/{project_id}/health_issues/{id}/resolve/
- `health_issues_refresh_create` — POST /api/environments/{project_id}/health_issues/refresh/
- `health_issues_summary_retrieve` — GET /api/environments/{project_id}/health_issues/summary/
- `lineage_get_upstream_retrieve` — GET /api/environments/{project_id}/lineage/get_upstream/
- `llm_analytics_clustering_config_retrieve` — Team-level clustering configuration (event filters for automated pipelines).
- `llm_analytics_clustering_config_set_event_filters_create` — Team-level clustering configuration (event filters for automated pipelines).
- `llm_analytics_clustering_jobs_list` — CRUD for clustering job configurations (max 5 per team).
- `llm_analytics_clustering_jobs_create` — CRUD for clustering job configurations (max 5 per team).
- `llm_analytics_clustering_jobs_retrieve` — CRUD for clustering job configurations (max 5 per team).
- `llm_analytics_clustering_jobs_update` — CRUD for clustering job configurations (max 5 per team).
- `llm_analytics_clustering_jobs_partial_update` — CRUD for clustering job configurations (max 5 per team).
- `llm_analytics_clustering_jobs_destroy` — CRUD for clustering job configurations (max 5 per team).
- `llm_analytics_evaluation_config_retrieve` — Get the evaluation config for this team
- `llm_analytics_evaluation_config_set_active_key_create` — Set the active provider key for evaluations
- `llm_analytics_evaluation_reports_list` — CRUD for evaluation report configurations + report run history.
- `llm_analytics_evaluation_reports_create` — CRUD for evaluation report configurations + report run history.
- `llm_analytics_evaluation_reports_retrieve` — CRUD for evaluation report configurations + report run history.
- `llm_analytics_evaluation_reports_update` — CRUD for evaluation report configurations + report run history.
- `llm_analytics_evaluation_reports_partial_update` — CRUD for evaluation report configurations + report run history.
- `llm_analytics_evaluation_reports_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `llm_analytics_evaluation_reports_generate_create` — Trigger immediate report generation.
- `llm_analytics_evaluation_reports_runs_list` — List report runs (history) for this report.
- `llm_analytics_evaluation_summary_create` — 
Generate an AI-powered summary of evaluation results.

This endpoint analyzes evaluation runs and identifies patterns in passing
and failing evaluations, providing actionable recommendations.

Data is fetched server-side by evaluation ID to ensure data integrity.

**Use Cases:**
- Understand why evaluations are passing or failing
- Identify systematic issues in LLM responses
- Get recommendations for improving response quality
- Review patterns across many evaluation runs at once
        
- `llm_analytics_models_retrieve` — List available models for a provider.
- `llm_analytics_offline_evaluations_experiment_items_create` — POST /api/environments/{project_id}/llm_analytics/offline_evaluations/experiment_items/
- `llm_analytics_provider_key_validations_create` — Validate LLM provider API keys without persisting them
- `llm_analytics_provider_keys_list` — GET /api/environments/{project_id}/llm_analytics/provider_keys/
- `llm_analytics_provider_keys_create` — POST /api/environments/{project_id}/llm_analytics/provider_keys/
- `llm_analytics_provider_keys_retrieve` — GET /api/environments/{project_id}/llm_analytics/provider_keys/{id}/
- `llm_analytics_provider_keys_update` — PUT /api/environments/{project_id}/llm_analytics/provider_keys/{id}/
- `llm_analytics_provider_keys_partial_update` — PATCH /api/environments/{project_id}/llm_analytics/provider_keys/{id}/
- `llm_analytics_provider_keys_destroy` — DELETE /api/environments/{project_id}/llm_analytics/provider_keys/{id}/
- `llm_analytics_provider_keys_assign_create` — Assign this key to evaluations and optionally re-enable them.
- `llm_analytics_provider_keys_dependent_configs_retrieve` — Get evaluations using this key and alternative keys for replacement.
- `llm_analytics_provider_keys_validate_create` — POST /api/environments/{project_id}/llm_analytics/provider_keys/{id}/validate/
- `llm_analytics_provider_keys_trial_evaluations_retrieve` — List enabled evaluations currently using trial credits for a given provider.
- `llm_analytics_review_queue_items_list` — GET /api/environments/{project_id}/llm_analytics/review_queue_items/
- `llm_analytics_review_queue_items_create` — POST /api/environments/{project_id}/llm_analytics/review_queue_items/
- `llm_analytics_review_queue_items_retrieve` — GET /api/environments/{project_id}/llm_analytics/review_queue_items/{id}/
- `llm_analytics_review_queue_items_partial_update` — PATCH /api/environments/{project_id}/llm_analytics/review_queue_items/{id}/
- `llm_analytics_review_queue_items_destroy` — DELETE /api/environments/{project_id}/llm_analytics/review_queue_items/{id}/
- `llm_analytics_review_queues_list` — GET /api/environments/{project_id}/llm_analytics/review_queues/
- `llm_analytics_review_queues_create` — POST /api/environments/{project_id}/llm_analytics/review_queues/
- `llm_analytics_review_queues_retrieve` — GET /api/environments/{project_id}/llm_analytics/review_queues/{id}/
- `llm_analytics_review_queues_partial_update` — PATCH /api/environments/{project_id}/llm_analytics/review_queues/{id}/
- `llm_analytics_review_queues_destroy` — DELETE /api/environments/{project_id}/llm_analytics/review_queues/{id}/
- `llm_analytics_score_definitions_list` — GET /api/environments/{project_id}/llm_analytics/score_definitions/
- `llm_analytics_score_definitions_create` — POST /api/environments/{project_id}/llm_analytics/score_definitions/
- `llm_analytics_score_definitions_retrieve` — GET /api/environments/{project_id}/llm_analytics/score_definitions/{id}/
- `llm_analytics_score_definitions_partial_update` — PATCH /api/environments/{project_id}/llm_analytics/score_definitions/{id}/
- `llm_analytics_score_definitions_new_version_create` — POST /api/environments/{project_id}/llm_analytics/score_definitions/{id}/new_version/
- `llm_analytics_sentiment_create` — POST /api/environments/{project_id}/llm_analytics/sentiment/
- `llm_analytics_sentiment_generations_create` — POST /api/environments/{project_id}/llm_analytics/sentiment/generations/
- `llm_analytics_summarization_create` — 
Generate an AI-powered summary of an LLM trace or event.

This endpoint analyzes the provided trace/event, generates a line-numbered text
representation, and uses an LLM to create a concise summary with line references.

**Two ways to use this endpoint:**

1. **By ID (recommended):** Pass `trace_id` or `generation_id` with an optional `date_from`/`date_to`.
   The backend fetches the data automatically. `summarize_type` is inferred.
2. **By data:** Pass the full trace/event data blob in `data` with `summarize_type`.
   This is how the frontend uses it.

**Summary Format:**
- Title (concise, max 10 words)
- Mermaid flow diagram showing the main flow
- 3-10 summary bullets with line references
- "Interesting Notes" section for failures, successes, or unusual patterns
- Line references in [L45] or [L45-52] format pointing to relevant sections

The response includes the structured summary, the text representation, and metadata.
        
- `llm_analytics_summarization_batch_check_create` — 
Check which traces have cached summaries available.

This endpoint allows batch checking of multiple trace IDs to see which ones
have cached summaries. Returns only the traces that have cached summaries
with their titles.

**Use Cases:**
- Load cached summaries on session view load
- Avoid unnecessary LLM calls for already-summarized traces
- Display summary previews without generating new summaries
        
- `llm_analytics_text_repr_create` — 
Generate a human-readable text representation of an LLM trace event.

This endpoint converts AI observability events ($ai_generation, $ai_span, $ai_embedding, or $ai_trace)
into formatted text representations suitable for display, logging, or analysis.

**Supported Event Types:**
- `$ai_generation`: Individual LLM API calls with input/output messages
- `$ai_span`: Logical spans with state transitions
- `$ai_embedding`: Embedding generation events (text input → vector)
- `$ai_trace`: Full traces with hierarchical structure

**Options:**
- `max_length`: Maximum character count (default: 2000000)
- `truncated`: Enable middle-content truncation within events (default: true)
- `truncate_buffer`: Characters at start/end when truncating (default: 1000)
- `include_markers`: Use interactive markers vs plain text indicators (default: true)
  - Frontend: set true for `<<<TRUNCATED|base64|...>>>` markers
  - Backend/LLM: set false for `... (X chars truncated) ...` text
- `collapsed`: Show summary vs full trace tree (default: false)
- `include_hierarchy`: Include tree structure for traces (default: true)
- `max_depth`: Maximum depth for hierarchical rendering (default: unlimited)
- `tools_collapse_threshold`: Number of tools before auto-collapsing list (default: 5)
  - Tool lists >5 items show `<<<TOOLS_EXPANDABLE|...>>>` marker for frontend
  - Or `[+] AVAILABLE TOOLS: N` for backend when `include_markers: false`
- `include_line_numbers`: Prefix each line with line number like L001:, L010: (default: false)

**Use Cases:**
- Frontend display: `truncated: true, include_markers: true, include_line_numbers: true`
- Backend LLM context (summary): `truncated: true, include_markers: false, collapsed: true`
- Backend LLM context (full): `truncated: false`

The response includes the formatted text and metadata about the rendering.
        
- `llm_analytics_trace_reviews_list` — GET /api/environments/{project_id}/llm_analytics/trace_reviews/
- `llm_analytics_trace_reviews_create` — POST /api/environments/{project_id}/llm_analytics/trace_reviews/
- `llm_analytics_trace_reviews_retrieve` — GET /api/environments/{project_id}/llm_analytics/trace_reviews/{id}/
- `llm_analytics_trace_reviews_partial_update` — PATCH /api/environments/{project_id}/llm_analytics/trace_reviews/{id}/
- `llm_analytics_trace_reviews_destroy` — DELETE /api/environments/{project_id}/llm_analytics/trace_reviews/{id}/
- `llm_analytics_translate_create` — Translate text to target language.
- `llm_prompts_list` — GET /api/environments/{project_id}/llm_prompts/
- `llm_prompts_create` — POST /api/environments/{project_id}/llm_prompts/
- `llm_prompts_name_retrieve` — GET /api/environments/{project_id}/llm_prompts/name/{prompt_name}/
- `llm_prompts_name_partial_update` — PATCH /api/environments/{project_id}/llm_prompts/name/{prompt_name}/
- `llm_prompts_name_archive_create` — POST /api/environments/{project_id}/llm_prompts/name/{prompt_name}/archive/
- `llm_prompts_name_duplicate_create` — POST /api/environments/{project_id}/llm_prompts/name/{prompt_name}/duplicate/
- `llm_prompts_resolve_name_retrieve` — GET /api/environments/{project_id}/llm_prompts/resolve/name/{prompt_name}/
- `llm_skills_list` — GET /api/environments/{project_id}/llm_skills/
- `llm_skills_create` — POST /api/environments/{project_id}/llm_skills/
- `llm_skills_name_retrieve` — GET /api/environments/{project_id}/llm_skills/name/{skill_name}/
- `llm_skills_name_partial_update` — PATCH /api/environments/{project_id}/llm_skills/name/{skill_name}/
- `llm_skills_name_archive_create` — POST /api/environments/{project_id}/llm_skills/name/{skill_name}/archive/
- `llm_skills_name_duplicate_create` — POST /api/environments/{project_id}/llm_skills/name/{skill_name}/duplicate/
- `llm_skills_name_files_create` — POST /api/environments/{project_id}/llm_skills/name/{skill_name}/files/
- `llm_skills_name_files_rename_create` — POST /api/environments/{project_id}/llm_skills/name/{skill_name}/files-rename/
- `llm_skills_name_files_retrieve` — GET /api/environments/{project_id}/llm_skills/name/{skill_name}/files/{file_path}/
- `llm_skills_name_files_destroy` — DELETE /api/environments/{project_id}/llm_skills/name/{skill_name}/files/{file_path}/
- `llm_skills_resolve_name_retrieve` — GET /api/environments/{project_id}/llm_skills/resolve/name/{skill_name}/
- `logs_explainLogWithAI_create` — Explain a log entry using AI.

POST /api/environments/:id/logs/explainLogWithAI/
- `logs_views_list` — GET /api/environments/{project_id}/logs/views/
- `logs_views_create` — POST /api/environments/{project_id}/logs/views/
- `logs_views_retrieve` — GET /api/environments/{project_id}/logs/views/{short_id}/
- `logs_views_update` — PUT /api/environments/{project_id}/logs/views/{short_id}/
- `logs_views_partial_update` — PATCH /api/environments/{project_id}/logs/views/{short_id}/
- `logs_views_destroy` — DELETE /api/environments/{project_id}/logs/views/{short_id}/
- `managed_viewsets_retrieve` — Get all views associated with a specific managed viewset.
GET /api/environments/{team_id}/managed_viewsets/{kind}/
- `managed_viewsets_update` — Enable or disable a managed viewset by kind.
PUT /api/environments/{team_id}/managed_viewsets/{kind}/ with body {"enabled": true/false}
- `max_tools_create_and_query_insight_create` — POST /api/environments/{project_id}/max_tools/create_and_query_insight/
- `mcp_server_installations_list` — GET /api/environments/{project_id}/mcp_server_installations/
- `mcp_server_installations_create` — POST /api/environments/{project_id}/mcp_server_installations/
- `mcp_server_installations_retrieve` — GET /api/environments/{project_id}/mcp_server_installations/{id}/
- `mcp_server_installations_update` — PUT /api/environments/{project_id}/mcp_server_installations/{id}/
- `mcp_server_installations_partial_update` — PATCH /api/environments/{project_id}/mcp_server_installations/{id}/
- `mcp_server_installations_destroy` — DELETE /api/environments/{project_id}/mcp_server_installations/{id}/
- `mcp_server_installations_proxy_create` — POST /api/environments/{project_id}/mcp_server_installations/{id}/proxy/
- `mcp_server_installations_tools_retrieve` — GET /api/environments/{project_id}/mcp_server_installations/{id}/tools/
- `mcp_server_installations_tools_partial_update` — PATCH /api/environments/{project_id}/mcp_server_installations/{id}/tools/{tool_name}/
- `mcp_server_installations_tools_refresh_create` — POST /api/environments/{project_id}/mcp_server_installations/{id}/tools/refresh/
- `mcp_server_installations_authorize_retrieve` — Start (or re-start) an OAuth flow.

Pass ``template_id`` to (re)connect a catalog template, or
``installation_id`` to reconnect an existing custom install using its
cached metadata and per-user DCR creds.
- `mcp_server_installations_install_custom_create` — POST /api/environments/{project_id}/mcp_server_installations/install_custom/
- `mcp_server_installations_install_template_create` — POST /api/environments/{project_id}/mcp_server_installations/install_template/
- `mcp_servers_list` — Lists curated MCP server templates that users can install with one click.

Templates are seeded by PostHog operators and carry shared, encrypted
OAuth client credentials. Inactive templates are hidden from the catalog.
- `mcp_tools_create` — Invoke an MCP tool by name.

This endpoint allows MCP callers to invoke Max AI tools directly
without going through the full LangChain conversation flow.

Scopes are resolved dynamically per tool via dangerously_get_required_scopes.
- `docs_search` — Search PostHog documentation
- `property_access_controls_retrieve` — Get all property access control rules for a property definition.
- `property_access_controls_create` — Create or update a property access control rule.
- `property_access_controls_destroy` — Delete a property access control rule. The rule is identified by `property_definition_id` plus an optional `organization_member` or `role` query parameter. Omitting both targets deletes the default rule.
- `retrieve_session_summaries_config` — Retrieve the team's session summaries configuration (product context used to tailor single-session replay summaries).
- `update_session_summaries_config` — Update the team's session summaries configuration (product context used to tailor single-session replay summaries).
- `create_session_summaries` — Generate AI summary for a group of session recordings to find patterns and generate a notebook.
- `create_session_summaries_individually` — Generate AI individual summary for each session, without grouping.
- `subscriptions_deliveries_list` — List subscription deliveries
- `subscriptions_deliveries_retrieve` — Retrieve subscription delivery
- `taggers_list` — GET /api/environments/{project_id}/taggers/
- `taggers_create` — POST /api/environments/{project_id}/taggers/
- `taggers_retrieve` — GET /api/environments/{project_id}/taggers/{id}/
- `taggers_update` — PUT /api/environments/{project_id}/taggers/{id}/
- `taggers_partial_update` — PATCH /api/environments/{project_id}/taggers/{id}/
- `taggers_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `taggers_test_hog_create` — Test Hog tagger code against sample events without saving.
- `tracing_spans_aggregate_create` — POST /api/environments/{project_id}/tracing/spans/aggregate/
- `tracing_spans_attributes_retrieve` — GET /api/environments/{project_id}/tracing/spans/attributes/
- `tracing_spans_query_create` — POST /api/environments/{project_id}/tracing/spans/query/
- `tracing_spans_service_names_retrieve` — GET /api/environments/{project_id}/tracing/spans/service-names/
- `tracing_spans_sparkline_create` — POST /api/environments/{project_id}/tracing/spans/sparkline/
- `tracing_spans_trace_create` — POST /api/environments/{project_id}/tracing/spans/trace/{trace_id}/
- `tracing_spans_tree_create` — POST /api/environments/{project_id}/tracing/spans/tree/
- `tracing_spans_values_retrieve` — GET /api/environments/{project_id}/tracing/spans/values/
- `user_interview_topics_list` — Planned user interview topics: who we want to target and what we want to ask about.
- `user_interview_topics_create` — Planned user interview topics: who we want to target and what we want to ask about.
- `user_interview_topics_retrieve` — Planned user interview topics: who we want to target and what we want to ask about.
- `user_interview_topics_update` — Planned user interview topics: who we want to target and what we want to ask about.
- `user_interview_topics_partial_update` — Planned user interview topics: who we want to target and what we want to ask about.
- `user_interview_topics_destroy` — Planned user interview topics: who we want to target and what we want to ask about.
- `user_interview_topics_add_interviewee_create` — Add a single interviewee to this topic. Email-shaped identifiers (including the `Display Name <email@host>` form) are appended to `interviewee_emails`; everything else is appended to `interviewee_distinct_ids`. Idempotent — adding an identifier that's already present leaves the topic unchanged. Returns the updated topic.
- `user_interview_topics_generate_links_create` — Generate one public interview link per targeted interviewee. Materializes an IntervieweeContext row for every identifier on the topic (without overwriting existing per-person context), and an enabled SharingConfiguration with a unique access token. The URL resolves to the public interview viewer with no PostHog auth required.
- `user_interview_topics_links_csv_create` — Same materialization as generate_links, returned as a downloadable CSV. Intended for users who want to mail-merge the per-person interview links into their own email tooling.
- `user_interview_topics_remove_interviewee_create` — Remove an interviewee from this topic. Drops the identifier from both `interviewee_emails` and `interviewee_distinct_ids`, and disables any active SharingConfiguration linked to an IntervieweeContext for that identifier on this topic so the removed person can no longer open their interview link. Idempotent — removing an identifier that isn't present is a no-op. Returns the updated topic.
- `user_interview_topics_send_invites_create` — Generate (if needed) and email a personalized public interview link to every targeted interviewee on this topic whose identifier is an email address. Distinct-ID-only interviewees are skipped and surfaced in the response. Each invite is keyed on the underlying SharingConfiguration so re-runs after token rotation produce a fresh send.
- `user_interview_topics_test_link_retrieve` — Return the calling user's personal dogfood interview link for this topic, plus the latest test interview they have recorded against it. Lazily get-or-creates a per-caller IntervieweeContext + enabled SharingConfiguration the first time it's called, then returns the same stable URL on subsequent calls. The caller's identifier is intentionally not added to the topic's targeting arrays — each user dogfoods under their own row, so test calls never mint a public share token on someone else's behalf.
- `user_interview_topics_interviewees_list` — Per-interviewee extra context for a user interview topic. At most one row per (topic, interviewee_identifier).
- `user_interview_topics_interviewees_create` — Per-interviewee extra context for a user interview topic. At most one row per (topic, interviewee_identifier).
- `user_interview_topics_interviewees_retrieve` — Per-interviewee extra context for a user interview topic. At most one row per (topic, interviewee_identifier).
- `user_interview_topics_interviewees_update` — Per-interviewee extra context for a user interview topic. At most one row per (topic, interviewee_identifier).
- `user_interview_topics_interviewees_partial_update` — Per-interviewee extra context for a user interview topic. At most one row per (topic, interviewee_identifier).
- `user_interview_topics_interviewees_destroy` — Per-interviewee extra context for a user interview topic. At most one row per (topic, interviewee_identifier).
- `user_interview_topics_interviewees_bulk_create` — Create up to 500 interviewee context rows for a topic in a single request. Rows whose (topic, interviewee_identifier) already exists are skipped — the response surfaces an `inserted_count`, a `skipped_count`, and the `skipped_identifiers` so the caller can reconcile. Items must have unique `interviewee_identifier` values within the batch.
- `user_interviews_list` — GET /api/environments/{project_id}/user_interviews/
- `user_interviews_create` — POST /api/environments/{project_id}/user_interviews/
- `user_interviews_retrieve` — GET /api/environments/{project_id}/user_interviews/{id}/
- `user_interviews_update` — PUT /api/environments/{project_id}/user_interviews/{id}/
- `user_interviews_partial_update` — PATCH /api/environments/{project_id}/user_interviews/{id}/
- `user_interviews_destroy` — DELETE /api/environments/{project_id}/user_interviews/{id}/
- `user_interviews_search_create` — Search interview responses by semantic similarity
- `vision_observations_list` — Read-only access to a session's observations across every scanner the caller can read, for the replay-page dock.
- `vision_observations_retrieve` — Read-only access to a session's observations across every scanner the caller can read, for the replay-page dock.
- `environment_vision_quota_retrieve` — GET /api/environments/{project_id}/vision/quota/
- `vision_scanners_list` — CRUD for Replay Vision scanners.
- `vision_scanners_create` — CRUD for Replay Vision scanners.
- `vision_scanners_retrieve` — CRUD for Replay Vision scanners.
- `vision_scanners_partial_update` — CRUD for Replay Vision scanners.
- `vision_scanners_destroy` — CRUD for Replay Vision scanners.
- `vision_scanners_observe_create` — Apply this scanner to one specific session, on demand. Returns 202 with the workflow handle.
- `vision_scanners_observations_list` — Read-only access to observations produced by a scanner.
- `vision_scanners_observations_retrieve` — Read-only access to observations produced by a scanner.
- `vision_scanners_estimate_create` — Estimate the observation volume a proposed scanner would generate, for the pre-save cost preview.
- `web_analytics_weekly_digest` — Summarize web analytics
- `web_vitals_retrieve` — Get web vitals for a specific pathname.
Toolbar accesses this via OAuth (handled by TeamAndOrgViewSetMixin.get_authenticators).
- `llm_analytics_personal_spend_list` — Return a structured personal LLM spend analysis for the requesting user. Pass `date_from` / `date_to` (absolute like `2026-04-23` or relative like `-7d`) to bound the window — defaults to the last 30 days, max 90 days. The `product=<ai_product>` query param is required and scopes the tool / model / trace breakdowns to a single product; supported values: posthog_code. `by_product` is always returned for cross-product visibility. Use `refresh=true` to bypass the 5-minute response cache.
- `list` — GET /api/organizations/
- `create` — POST /api/organizations/
- `retrieve` — GET /api/organizations/{id}/
- `update` — PUT /api/organizations/{id}/
- `partial_update` — PATCH /api/organizations/{id}/
- `destroy` — DELETE /api/organizations/{id}/
- `org_organizations_advanced_activity_logs_list` — Organization-wide view of activity logs across every project in the organization.

Mounted at /api/organizations/<organization_id>/advanced_activity_logs/.
Restricted to organization admins and owners.
- `org_organizations_advanced_activity_logs_available_filters_retrieve` — Organization-wide view of activity logs across every project in the organization.

Mounted at /api/organizations/<organization_id>/advanced_activity_logs/.
Restricted to organization admins and owners.
- `org_organizations_advanced_activity_logs_export_create` — Organization-wide view of activity logs across every project in the organization.

Mounted at /api/organizations/<organization_id>/advanced_activity_logs/.
Restricted to organization admins and owners.
- `org_organizations_batch_exports_list` — GET /api/organizations/{organization_id}/batch_exports/
- `org_organizations_batch_exports_create` — POST /api/organizations/{organization_id}/batch_exports/
- `org_organizations_batch_exports_retrieve` — GET /api/organizations/{organization_id}/batch_exports/{id}/
- `org_organizations_batch_exports_update` — PUT /api/organizations/{organization_id}/batch_exports/{id}/
- `org_organizations_batch_exports_partial_update` — PATCH /api/organizations/{organization_id}/batch_exports/{id}/
- `org_organizations_batch_exports_destroy` — DELETE /api/organizations/{organization_id}/batch_exports/{id}/
- `org_organizations_batch_exports_logs_retrieve` — GET /api/organizations/{organization_id}/batch_exports/{id}/logs/
- `org_organizations_batch_exports_pause_create` — Pause a BatchExport.
- `org_organizations_batch_exports_run_test_step_create` — POST /api/organizations/{organization_id}/batch_exports/{id}/run_test_step/
- `org_organizations_batch_exports_unpause_create` — Unpause a BatchExport.
- `org_organizations_batch_exports_run_test_step_new_create` — POST /api/organizations/{organization_id}/batch_exports/run_test_step_new/
- `org_organizations_batch_exports_test_retrieve` — GET /api/organizations/{organization_id}/batch_exports/test/
- `cimd_verification_tokens_list` — Manage CIMD verification tokens for an organization.

A partner embeds the plaintext token in their CIMD metadata document under
`posthog_verification_token`. When PostHog fetches the metadata, matching
the token links the partner app to this organization and grants a higher
default rate limit for account provisioning.

The plaintext value is only available on creation; we store a hash.
- `cimd_verification_tokens_create` — Manage CIMD verification tokens for an organization.

A partner embeds the plaintext token in their CIMD metadata document under
`posthog_verification_token`. When PostHog fetches the metadata, matching
the token links the partner app to this organization and grants a higher
default rate limit for account provisioning.

The plaintext value is only available on creation; we store a hash.
- `cimd_verification_tokens_retrieve` — Manage CIMD verification tokens for an organization.

A partner embeds the plaintext token in their CIMD metadata document under
`posthog_verification_token`. When PostHog fetches the metadata, matching
the token links the partner app to this organization and grants a higher
default rate limit for account provisioning.

The plaintext value is only available on creation; we store a hash.
- `cimd_verification_tokens_destroy` — Manage CIMD verification tokens for an organization.

A partner embeds the plaintext token in their CIMD metadata document under
`posthog_verification_token`. When PostHog fetches the metadata, matching
the token links the partner app to this organization and grants a higher
default rate limit for account provisioning.

The plaintext value is only available on creation; we store a hash.
- `domains_list` — GET /api/organizations/{organization_id}/domains/
- `domains_create` — POST /api/organizations/{organization_id}/domains/
- `domains_retrieve` — GET /api/organizations/{organization_id}/domains/{id}/
- `domains_update` — PUT /api/organizations/{organization_id}/domains/{id}/
- `domains_partial_update` — PATCH /api/organizations/{organization_id}/domains/{id}/
- `domains_destroy` — DELETE /api/organizations/{organization_id}/domains/{id}/
- `domains_scim_logs_retrieve` — GET /api/organizations/{organization_id}/domains/{id}/scim/logs/
- `domains_scim_token_create` — Regenerate SCIM bearer token.
- `domains_verify_create` — POST /api/organizations/{organization_id}/domains/{id}/verify/
- `org_organizations_integrations_list` — ViewSet for organization-level integrations.

Provides access to integrations that are scoped to the entire organization
(vs. project-level integrations). Examples include Vercel, AWS Marketplace, etc.

Creation is handled by the integration installation flows
(e.g., Vercel marketplace installation). Users can disconnect integrations
via the DELETE endpoint.
- `org_organizations_integrations_retrieve` — ViewSet for organization-level integrations.

Provides access to integrations that are scoped to the entire organization
(vs. project-level integrations). Examples include Vercel, AWS Marketplace, etc.

Creation is handled by the integration installation flows
(e.g., Vercel marketplace installation). Users can disconnect integrations
via the DELETE endpoint.
- `org_organization_integrations_destroy` — ViewSet for organization-level integrations.

Provides access to integrations that are scoped to the entire organization
(vs. project-level integrations). Examples include Vercel, AWS Marketplace, etc.

Creation is handled by the integration installation flows
(e.g., Vercel marketplace installation). Users can disconnect integrations
via the DELETE endpoint.
- `integrations_environment_mapping_partial_update` — ViewSet for organization-level integrations.

Provides access to integrations that are scoped to the entire organization
(vs. project-level integrations). Examples include Vercel, AWS Marketplace, etc.

Creation is handled by the integration installation flows
(e.g., Vercel marketplace installation). Users can disconnect integrations
via the DELETE endpoint.
- `invites_list` — GET /api/organizations/{organization_id}/invites/
- `invites_create` — POST /api/organizations/{organization_id}/invites/
- `invites_destroy` — DELETE /api/organizations/{organization_id}/invites/{id}/
- `invites_bulk_create` — POST /api/organizations/{organization_id}/invites/bulk/
- `invites_delegate_create` — Create an onboarding delegation invite: an admin-level invite flagged as a setup delegation.
Sends a single dedicated delegation email and records the inviting user as having delegated.
- `legal_documents_list` — GET /api/organizations/{organization_id}/legal_documents/
- `legal_documents_create` — POST /api/organizations/{organization_id}/legal_documents/
- `legal_documents_retrieve` — GET /api/organizations/{organization_id}/legal_documents/{id}/
- `legal_documents_download_retrieve` — Short-lived redirect to the signed PDF in object storage. 404 while the
envelope is still out for signature (or if the upload hasn't completed
yet). The underlying presigned URL expires in ~60s; clients should hit
this endpoint each time they want to view the PDF rather than caching.
- `members_list` — GET /api/organizations/{organization_id}/members/
- `members_update` — PUT /api/organizations/{organization_id}/members/{user__uuid}/
- `members_partial_update` — PATCH /api/organizations/{organization_id}/members/{user__uuid}/
- `members_destroy` — DELETE /api/organizations/{organization_id}/members/{user__uuid}/
- `members_scoped_api_keys_retrieve` — GET /api/organizations/{organization_id}/members/{user__uuid}/scoped_api_keys/
- `oauth_applications_list` — ViewSet for listing OAuth applications at the organization level (read-only).
- `organizations_projects_list` — Projects for the current organization.
- `organizations_projects_create` — Projects for the current organization.
- `organizations_projects_retrieve` — Retrieve a project and its settings.
- `organizations_projects_update` — Replace a project and its settings. Prefer the PATCH endpoint for partial updates — PUT requires every writable field to be provided.
- `organizations_projects_partial_update` — Update one or more of a project's settings. Only the fields included in the request body are changed.
- `organizations_projects_destroy` — Projects for the current organization.
- `organizations_projects_activity_retrieve` — Projects for the current organization.
- `organizations_projects_add_product_intent_partial_update` — Projects for the current organization.
- `organizations_projects_change_organization_create` — Projects for the current organization.
- `organizations_projects_complete_product_onboarding_partial_update` — Projects for the current organization.
- `organizations_projects_delete_secret_token_backup_partial_update` — Projects for the current organization.
- `organizations_projects_generate_conversations_public_token_create` — Projects for the current organization.
- `organizations_projects_is_generating_demo_data_retrieve` — Projects for the current organization.
- `organizations_projects_reset_token_partial_update` — Projects for the current organization.
- `organizations_projects_rotate_secret_token_partial_update` — Projects for the current organization.
- `proxy_records_list` — List all reverse proxies configured for the organization. Returns proxy records along with the maximum number allowed by the current plan.
- `proxy_records_create` — Create a new managed reverse proxy. Provide the domain you want to proxy through. The response includes the CNAME target you need to add as a DNS record. Once the CNAME is configured, the proxy will be automatically verified and provisioned.
- `proxy_records_retrieve` — Get details of a specific reverse proxy by ID. Returns the full configuration including domain, CNAME target, and current provisioning status.
- `proxy_records_destroy` — Delete a reverse proxy. For proxies in 'waiting', 'erroring', or 'timed_out' status, the record is deleted immediately. For active proxies, a deletion workflow is started to clean up the provisioned infrastructure.
- `proxy_records_diagnose_create` — Run a deep diagnostic on a reverse proxy. Inspects DNS CNAME alignment, the certificate provider's hostname state, CAA records walked up the customer's DNS tree, HTTP-01 challenge reachability, a live event probe, and certificate expiry. Returns a structured report with each check's status and concrete remediation steps (e.g. exact DNS records to add). Use this to debug why a proxy is stuck or erroring.
- `proxy_records_retry_create` — Retry provisioning a failed reverse proxy. Only available for proxies in 'erroring' or 'timed_out' status. Resets the proxy to 'waiting' status and restarts the provisioning workflow.
- `role_external_references_list` — GET /api/organizations/{organization_id}/role_external_references/
- `role_external_references_create` — POST /api/organizations/{organization_id}/role_external_references/
- `role_external_references_destroy` — DELETE /api/organizations/{organization_id}/role_external_references/{id}/
- `role_external_references_lookup_retrieve` — GET /api/organizations/{organization_id}/role_external_references/lookup/
- `roles_list` — GET /api/organizations/{organization_id}/roles/
- `roles_create` — POST /api/organizations/{organization_id}/roles/
- `roles_retrieve` — GET /api/organizations/{organization_id}/roles/{id}/
- `roles_update` — PUT /api/organizations/{organization_id}/roles/{id}/
- `roles_partial_update` — PATCH /api/organizations/{organization_id}/roles/{id}/
- `roles_destroy` — DELETE /api/organizations/{organization_id}/roles/{id}/
- `roles_role_memberships_list` — GET /api/organizations/{organization_id}/roles/{role_id}/role_memberships/
- `roles_role_memberships_create` — POST /api/organizations/{organization_id}/roles/{role_id}/role_memberships/
- `roles_role_memberships_retrieve` — GET /api/organizations/{organization_id}/roles/{role_id}/role_memberships/{id}/
- `roles_role_memberships_destroy` — DELETE /api/organizations/{organization_id}/roles/{role_id}/role_memberships/{id}/
- `welcome_current_retrieve` — Aggregated payload for the invited-user welcome screen.
- `actions_list` — GET /api/projects/{project_id}/actions/
- `actions_create` — POST /api/projects/{project_id}/actions/
- `actions_retrieve` — GET /api/projects/{project_id}/actions/{id}/
- `actions_update` — PUT /api/projects/{project_id}/actions/{id}/
- `actions_partial_update` — PATCH /api/projects/{project_id}/actions/{id}/
- `actions_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `actions_references_list` — GET /api/projects/{project_id}/actions/{id}/references/
- `actions_bulk_update_tags_create` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `activity_log_list` — GET /api/projects/{project_id}/activity_log/
- `advanced_activity_logs_list` — GET /api/projects/{project_id}/advanced_activity_logs/
- `advanced_activity_logs_available_filters_retrieve` — GET /api/projects/{project_id}/advanced_activity_logs/available_filters/
- `advanced_activity_logs_export_create` — POST /api/projects/{project_id}/advanced_activity_logs/export/
- `alerts_list` — GET /api/projects/{project_id}/alerts/
- `alerts_create` — POST /api/projects/{project_id}/alerts/
- `alerts_retrieve` — GET /api/projects/{project_id}/alerts/{id}/
- `alerts_update` — PUT /api/projects/{project_id}/alerts/{id}/
- `alerts_partial_update` — PATCH /api/projects/{project_id}/alerts/{id}/
- `alerts_destroy` — DELETE /api/projects/{project_id}/alerts/{id}/
- `alerts_simulate_create` — Simulate a detector on an insight's historical data. Read-only — no AlertCheck records are created.
- `annotations_list` — Create, Read, Update and Delete annotations. [See docs](https://posthog.com/docs/data/annotations) for more information on annotations.
- `annotations_create` — Create, Read, Update and Delete annotations. [See docs](https://posthog.com/docs/data/annotations) for more information on annotations.
- `annotations_retrieve` — Create, Read, Update and Delete annotations. [See docs](https://posthog.com/docs/data/annotations) for more information on annotations.
- `annotations_update` — Create, Read, Update and Delete annotations. [See docs](https://posthog.com/docs/data/annotations) for more information on annotations.
- `annotations_partial_update` — Create, Read, Update and Delete annotations. [See docs](https://posthog.com/docs/data/annotations) for more information on annotations.
- `annotations_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `batch_exports_list` — GET /api/projects/{project_id}/batch_exports/
- `batch_exports_create` — POST /api/projects/{project_id}/batch_exports/
- `batch_exports_backfills_list` — ViewSet for BatchExportBackfill models.

Allows creating and reading backfills, but not updating or deleting them.
- `batch_exports_backfills_create` — Create a new backfill for a BatchExport.
- `batch_exports_backfills_retrieve` — ViewSet for BatchExportBackfill models.

Allows creating and reading backfills, but not updating or deleting them.
- `batch_exports_backfills_cancel_create` — Cancel a batch export backfill.
- `batch_exports_runs_list` — GET /api/projects/{project_id}/batch_exports/{batch_export_id}/runs/
- `batch_exports_runs_retrieve` — GET /api/projects/{project_id}/batch_exports/{batch_export_id}/runs/{id}/
- `batch_exports_runs_cancel_create` — Cancel a batch export run.
- `batch_exports_runs_logs_retrieve` — GET /api/projects/{project_id}/batch_exports/{batch_export_id}/runs/{id}/logs/
- `batch_exports_runs_retry_create` — Retry a batch export run.

We use the same underlying mechanism as when backfilling a batch export, as retrying
a run is the same as backfilling one run.
- `batch_exports_retrieve` — GET /api/projects/{project_id}/batch_exports/{id}/
- `batch_exports_update` — PUT /api/projects/{project_id}/batch_exports/{id}/
- `batch_exports_partial_update` — PATCH /api/projects/{project_id}/batch_exports/{id}/
- `batch_exports_destroy` — DELETE /api/projects/{project_id}/batch_exports/{id}/
- `batch_exports_logs_retrieve` — GET /api/projects/{project_id}/batch_exports/{id}/logs/
- `batch_exports_pause_create` — Pause a BatchExport.
- `batch_exports_run_test_step_create` — POST /api/projects/{project_id}/batch_exports/{id}/run_test_step/
- `batch_exports_unpause_create` — Unpause a BatchExport.
- `batch_exports_run_test_step_new_create` — POST /api/projects/{project_id}/batch_exports/run_test_step_new/
- `batch_exports_test_retrieve` — GET /api/projects/{project_id}/batch_exports/test/
- `business_knowledge_sources_list` — GET /api/projects/{project_id}/business_knowledge/sources/
- `business_knowledge_sources_create` — POST /api/projects/{project_id}/business_knowledge/sources/
- `business_knowledge_sources_retrieve` — GET /api/projects/{project_id}/business_knowledge/sources/{id}/
- `business_knowledge_sources_partial_update` — PATCH /api/projects/{project_id}/business_knowledge/sources/{id}/
- `business_knowledge_sources_destroy` — DELETE /api/projects/{project_id}/business_knowledge/sources/{id}/
- `business_knowledge_sources_refresh_create` — POST /api/projects/{project_id}/business_knowledge/sources/{id}/refresh/
- `business_knowledge_sources_text_retrieve` — GET /api/projects/{project_id}/business_knowledge/sources/{id}/text/
- `cohorts_list` — GET /api/projects/{project_id}/cohorts/
- `cohorts_create` — POST /api/projects/{project_id}/cohorts/
- `cohorts_retrieve` — GET /api/projects/{project_id}/cohorts/{id}/
- `cohorts_update` — PUT /api/projects/{project_id}/cohorts/{id}/
- `cohorts_partial_update` — PATCH /api/projects/{project_id}/cohorts/{id}/
- `cohorts_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `cohorts_activity_retrieve` — GET /api/projects/{project_id}/cohorts/{id}/activity/
- `cohorts_add_persons_to_static_cohort_partial_update` — PATCH /api/projects/{project_id}/cohorts/{id}/add_persons_to_static_cohort/
- `cohorts_calculation_history_retrieve` — GET /api/projects/{project_id}/cohorts/{id}/calculation_history/
- `cohorts_persons_retrieve` — GET /api/projects/{project_id}/cohorts/{id}/persons/
- `cohorts_remove_person_from_static_cohort_partial_update` — PATCH /api/projects/{project_id}/cohorts/{id}/remove_person_from_static_cohort/
- `cohorts_all_activity_retrieve` — GET /api/projects/{project_id}/cohorts/activity/
- `comments_list` — GET /api/projects/{project_id}/comments/
- `comments_create` — POST /api/projects/{project_id}/comments/
- `comments_retrieve` — GET /api/projects/{project_id}/comments/{id}/
- `comments_update` — PUT /api/projects/{project_id}/comments/{id}/
- `comments_partial_update` — PATCH /api/projects/{project_id}/comments/{id}/
- `comments_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `comments_complete_create` — Mark a task-comment as complete. Sets completed_at and completed_by. 400 if the comment is not a task or is already complete.
- `comments_reopen_create` — Reopen a completed task-comment. Clears completed_at and completed_by. 400 if the comment is not a task or is already open.
- `comments_thread_retrieve` — GET /api/projects/{project_id}/comments/{id}/thread/
- `comments_count_retrieve` — GET /api/projects/{project_id}/comments/count/
- `conversations_tickets_list` — List tickets with person data attached.
- `conversations_tickets_create` — POST /api/projects/{project_id}/conversations/tickets/
- `conversations_tickets_retrieve` — Get single ticket and mark as read by team.
- `conversations_tickets_update` — Handle ticket updates including assignee changes.
- `conversations_tickets_partial_update` — PATCH /api/projects/{project_id}/conversations/tickets/{id}/
- `conversations_tickets_destroy` — DELETE /api/projects/{project_id}/conversations/tickets/{id}/
- `conversations_tickets_suggest_reply_create` — POST /api/projects/{project_id}/conversations/tickets/{id}/suggest_reply/
- `conversations_tickets_bulk_update_tags_create` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `conversations_tickets_compose_create` — Create a new outbound ticket and send the first message to the customer.
- `conversations_tickets_unread_count_retrieve` — Get total unread ticket count for the team.

Returns the sum of unread_team_count for all non-resolved tickets.
Cached in Redis for 30 seconds, invalidated on changes.
- `dashboard_templates_list` — GET /api/projects/{project_id}/dashboard_templates/
- `dashboard_templates_create` — POST /api/projects/{project_id}/dashboard_templates/
- `dashboard_templates_retrieve` — GET /api/projects/{project_id}/dashboard_templates/{id}/
- `dashboard_templates_update` — PUT /api/projects/{project_id}/dashboard_templates/{id}/
- `dashboard_templates_partial_update` — PATCH /api/projects/{project_id}/dashboard_templates/{id}/
- `dashboard_templates_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `dashboard_templates_copy_between_projects_create` — Copy a team template to this project
- `dashboard_templates_json_schema_retrieve` — GET /api/projects/{project_id}/dashboard_templates/json_schema/
- `dashboards_list` — GET /api/projects/{project_id}/dashboards/
- `dashboards_create` — POST /api/projects/{project_id}/dashboards/
- `dashboards_collaborators_list` — GET /api/projects/{project_id}/dashboards/{dashboard_id}/collaborators/
- `dashboards_collaborators_create` — POST /api/projects/{project_id}/dashboards/{dashboard_id}/collaborators/
- `dashboards_collaborators_destroy` — DELETE /api/projects/{project_id}/dashboards/{dashboard_id}/collaborators/{user__uuid}/
- `dashboards_sharing_list` — GET /api/projects/{project_id}/dashboards/{dashboard_id}/sharing/
- `dashboards_sharing_passwords_create` — Create a new password for the sharing configuration.
- `dashboards_sharing_passwords_destroy` — Delete a password from the sharing configuration.
- `dashboards_sharing_refresh_create` — POST /api/projects/{project_id}/dashboards/{dashboard_id}/sharing/refresh/
- `dashboards_retrieve` — GET /api/projects/{project_id}/dashboards/{id}/
- `dashboards_update` — PUT /api/projects/{project_id}/dashboards/{id}/
- `dashboards_partial_update` — PATCH /api/projects/{project_id}/dashboards/{id}/
- `dashboards_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `dashboards_analyze_refresh_result_create` — Generate AI analysis comparing before/after dashboard refresh.
Expects cache_key in request body pointing to the stored 'before' state.
- `dashboards_copy_tile_create` — Copy an existing dashboard tile to another dashboard (insight or text card; new tile row).
- `dashboards_create_text_tile_create` — Add a markdown text tile to a dashboard.

Text tiles render as markdown blocks on the dashboard — useful as section headings, dividers,
or annotations between insight tiles to give the dashboard structure.
- `dashboards_move_tile_partial_update` — PATCH /api/projects/{project_id}/dashboards/{id}/move_tile/
- `dashboards_reorder_tiles_create` — POST /api/projects/{project_id}/dashboards/{id}/reorder_tiles/
- `dashboards_run_insights_retrieve` — Run all insights on a dashboard and return their results.
- `dashboards_snapshot_create` — Snapshot the current dashboard state (from cache) for AI analysis.
Returns a cache_key representing the 'before' state, to be used with analyze_refresh_result.
- `dashboards_stream_tiles_retrieve` — Stream dashboard metadata and tiles via Server-Sent Events. Sends metadata first, then tiles as they are rendered.
- `dashboards_update_text_tile_create` — Update the markdown body, layout, or color of an existing text tile on a dashboard.
- `dashboards_bulk_update_tags_create` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `dashboards_create_from_template_json_create` — POST /api/projects/{project_id}/dashboards/create_from_template_json/
- `dashboards_create_unlisted_dashboard_create` — Creates an unlisted dashboard from template by tag.
Enforces uniqueness (one per tag per team).
Returns 409 if unlisted dashboard with this tag already exists.
- `data_color_themes_list` — GET /api/projects/{project_id}/data_color_themes/
- `data_color_themes_create` — POST /api/projects/{project_id}/data_color_themes/
- `data_color_themes_retrieve` — GET /api/projects/{project_id}/data_color_themes/{id}/
- `data_color_themes_update` — PUT /api/projects/{project_id}/data_color_themes/{id}/
- `data_color_themes_partial_update` — PATCH /api/projects/{project_id}/data_color_themes/{id}/
- `data_color_themes_destroy` — DELETE /api/projects/{project_id}/data_color_themes/{id}/
- `data_modeling_jobs_list` — List data modeling jobs which are "runs" for our saved queries.
- `data_modeling_jobs_retrieve` — List data modeling jobs which are "runs" for our saved queries.
- `data_modeling_jobs_recent_retrieve` — Get the most recent non-running job for each saved query from the v2 backend.
- `data_modeling_jobs_running_retrieve` — Get all currently running jobs from the v2 backend.
- `data_warehouse_check_database_name_retrieve` — Check if a database name is available.
- `data_warehouse_completed_activity_retrieve` — Returns completed/non-running activities (jobs with status 'Completed').
Supports pagination and cutoff time filtering.
- `data_warehouse_data_health_issues_retrieve` — Returns failed/disabled data pipeline items for the Pipeline status side panel.
Includes: materializations, syncs, sources, destinations, and transformations.
- `data_warehouse_data_ops_dashboard_retrieve` — Returns the data ops overview dashboard ID for this team, creating it if it doesn't exist yet.
- `data_warehouse_deprovision_create` — Start deprovisioning the managed warehouse for this team.
- `data_warehouse_job_stats_retrieve` — Returns success and failed job statistics for the last 1, 7, or 30 days.
Query parameter 'days' can be 1, 7, or 30 (default: 7).
- `data_warehouse_property_values_retrieve` — API endpoints for data warehouse aggregate statistics and operations.
- `data_warehouse_provision_create` — Start provisioning a managed warehouse for this team.
- `data_warehouse_reset_password_create` — Reset the root password for the managed warehouse.
- `data_warehouse_running_activity_retrieve` — Returns currently running activities (jobs with status 'Running').
Supports pagination and cutoff time filtering.
- `data_warehouse_total_rows_stats_retrieve` — Returns aggregated statistics for the data warehouse total rows processed within the current billing period.
Used by the frontend data warehouse scene to display usage information.
- `data_warehouse_warehouse_status_retrieve` — Get the current provisioning status of the managed warehouse.
- `dataset_items_list` — GET /api/projects/{project_id}/dataset_items/
- `dataset_items_create` — POST /api/projects/{project_id}/dataset_items/
- `dataset_items_retrieve` — GET /api/projects/{project_id}/dataset_items/{id}/
- `dataset_items_update` — PUT /api/projects/{project_id}/dataset_items/{id}/
- `dataset_items_partial_update` — PATCH /api/projects/{project_id}/dataset_items/{id}/
- `dataset_items_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `datasets_list` — GET /api/projects/{project_id}/datasets/
- `datasets_create` — POST /api/projects/{project_id}/datasets/
- `datasets_retrieve` — GET /api/projects/{project_id}/datasets/{id}/
- `datasets_update` — PUT /api/projects/{project_id}/datasets/{id}/
- `datasets_partial_update` — PATCH /api/projects/{project_id}/datasets/{id}/
- `datasets_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `deployment_projects_list` — CRUD for DeploymentProject (the connected-repo + hosting-target entity).

Create-time provisioning calls Cloudflare BEFORE writing the DB row
(see services/provision_project.py for the rationale). Delete is a
soft-delete; Cloudflare-side cleanup is deferred to a periodic Celery
task.
- `deployment_projects_create` — CRUD for DeploymentProject (the connected-repo + hosting-target entity).

Create-time provisioning calls Cloudflare BEFORE writing the DB row
(see services/provision_project.py for the rationale). Delete is a
soft-delete; Cloudflare-side cleanup is deferred to a periodic Celery
task.
- `deployment_projects_deployments_list` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `deployment_projects_deployments_create` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `deployment_projects_deployments_retrieve` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `deployment_projects_deployments_cancel_create` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `deployment_projects_deployments_events_list` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `deployment_projects_deployments_logs_retrieve` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `deployment_projects_deployments_redeploy_create` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `deployment_projects_deployments_refresh_preview_create` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `deployment_projects_deployments_rollback_create` — Full lifecycle viewset for Deployments.

All deployments are scoped to a parent DeploymentProject via the URL
parent lookup `deployment_project_id`. The viewset enforces that
scoping in `safely_get_queryset` so a user can never see / mutate a
deployment that doesn't belong to the project in the URL.
- `deployment_projects_retrieve` — CRUD for DeploymentProject (the connected-repo + hosting-target entity).

Create-time provisioning calls Cloudflare BEFORE writing the DB row
(see services/provision_project.py for the rationale). Delete is a
soft-delete; Cloudflare-side cleanup is deferred to a periodic Celery
task.
- `deployment_projects_update` — CRUD for DeploymentProject (the connected-repo + hosting-target entity).

Create-time provisioning calls Cloudflare BEFORE writing the DB row
(see services/provision_project.py for the rationale). Delete is a
soft-delete; Cloudflare-side cleanup is deferred to a periodic Celery
task.
- `deployment_projects_partial_update` — CRUD for DeploymentProject (the connected-repo + hosting-target entity).

Create-time provisioning calls Cloudflare BEFORE writing the DB row
(see services/provision_project.py for the rationale). Delete is a
soft-delete; Cloudflare-side cleanup is deferred to a periodic Celery
task.
- `deployment_projects_destroy` — CRUD for DeploymentProject (the connected-repo + hosting-target entity).

Create-time provisioning calls Cloudflare BEFORE writing the DB row
(see services/provision_project.py for the rationale). Delete is a
soft-delete; Cloudflare-side cleanup is deferred to a periodic Celery
task.
- `deployment_projects_refresh_create` — Refresh a deployment project's GitHub branch
- `deployment_projects_detect_create` — Suggest project config from a repo's package.json and lockfiles
- `early_access_feature_list` — GET /api/projects/{project_id}/early_access_feature/
- `early_access_feature_create` — POST /api/projects/{project_id}/early_access_feature/
- `early_access_feature_retrieve` — GET /api/projects/{project_id}/early_access_feature/{id}/
- `early_access_feature_update` — PUT /api/projects/{project_id}/early_access_feature/{id}/
- `early_access_feature_partial_update` — PATCH /api/projects/{project_id}/early_access_feature/{id}/
- `early_access_feature_destroy` — DELETE /api/projects/{project_id}/early_access_feature/{id}/
- `elements_list` — GET /api/projects/{project_id}/elements/
- `elements_create` — POST /api/projects/{project_id}/elements/
- `elements_retrieve` — GET /api/projects/{project_id}/elements/{id}/
- `elements_update` — PUT /api/projects/{project_id}/elements/{id}/
- `elements_partial_update` — PATCH /api/projects/{project_id}/elements/{id}/
- `elements_destroy` — DELETE /api/projects/{project_id}/elements/{id}/
- `elements_stats_retrieve` — The original version of this API always and only returned $autocapture elements
If no include query parameter is sent this remains true.
Now, you can pass a combination of include query parameters to get different types of elements
Currently only $autocapture and $rageclick and $dead_click are supported
- `elements_values_retrieve` — GET /api/projects/{project_id}/elements/values/
- `endpoints_list` — List all endpoints for the team.
- `endpoints_create` — Create a new endpoint.
- `endpoints_retrieve` — Retrieve an endpoint, or a specific version via ?version=N.
- `endpoints_update` — Update an existing endpoint. Parameters are optional. Pass version in body or ?version=N query param to target a specific version.
- `endpoints_partial_update` — Update an existing endpoint.
- `endpoints_destroy` — Delete an endpoint and clean up materialized query.
- `endpoints_materialization_preview_create` — Preview the materialization transform for an endpoint. Shows what the query will look like after materialization, including range pair detection and bucket functions.
- `endpoints_materialization_status_retrieve` — Get materialization status for an endpoint. Supports ?version=N query param.
- `endpoints_openapi_spec_retrieve` — Get OpenAPI 3.0 specification for this endpoint. Use this to generate typed SDK clients.
- `endpoints_run_retrieve` — Execute endpoint with optional materialization. Supports version parameter, runs latest version if not set.
- `endpoints_run_create` — Execute endpoint with optional materialization. Supports version parameter, runs latest version if not set.
- `endpoints_versions_list` — List all versions for an endpoint.
- `endpoints_last_execution_times_create` — Get the last execution times in the past 6 months for multiple endpoints.
- `environments_list` — Deprecated: use /api/environments/{id}/ instead.
- `environments_create` — Deprecated: use /api/environments/{id}/ instead.
- `environments_retrieve` — Deprecated: use /api/environments/{id}/ instead.
- `environments_update` — Deprecated: use /api/environments/{id}/ instead.
- `environments_partial_update` — Deprecated: use /api/environments/{id}/ instead.
- `environments_destroy` — Deprecated: use /api/environments/{id}/ instead.
- `environments_activity_retrieve` — Deprecated: use /api/environments/{id}/ instead.
- `environments_add_product_intent_partial_update` — Deprecated: use /api/environments/{id}/ instead.
- `environments_complete_product_onboarding_partial_update` — Deprecated: use /api/environments/{id}/ instead.
- `environments_default_evaluation_contexts_retrieve` — Manage default evaluation contexts for a team.
- `environments_default_evaluation_contexts_create` — Manage default evaluation contexts for a team.
- `environments_default_evaluation_contexts_destroy` — Manage default evaluation contexts for a team.
- `environments_default_release_conditions_retrieve` — Manage default release conditions for new feature flags in this team.
- `environments_default_release_conditions_update` — Manage default release conditions for new feature flags in this team.
- `environments_delete_secret_token_backup_partial_update` — Deprecated: use /api/environments/{id}/ instead.
- `environments_event_ingestion_restrictions_retrieve` — Deprecated: use /api/environments/{id}/ instead.
- `environments_experiments_config_retrieve` — Manage experiment configuration for this environment.
- `environments_experiments_config_partial_update` — Manage experiment configuration for this environment.
- `environments_generate_conversations_public_token_create` — Deprecated: use /api/environments/{id}/ instead.
- `environments_is_generating_demo_data_retrieve` — Deprecated: use /api/environments/{id}/ instead.
- `environments_logs_config_retrieve` — Manage logs product configuration for this environment.
- `environments_logs_config_partial_update` — Manage logs product configuration for this environment.
- `environments_reset_token_partial_update` — Deprecated: use /api/environments/{id}/ instead.
- `environments_rotate_secret_token_partial_update` — Deprecated: use /api/environments/{id}/ instead.
- `environments_settings_as_of_retrieve` — Return the team settings as of the provided timestamp.
Query params:
- at: ISO8601 datetime (required)
- scope: optional, one or multiple keys to filter the returned settings
- `error_tracking_releases_list` — GET /api/projects/{project_id}/error_tracking/releases/
- `error_tracking_releases_create` — POST /api/projects/{project_id}/error_tracking/releases/
- `error_tracking_releases_retrieve` — GET /api/projects/{project_id}/error_tracking/releases/{id}/
- `error_tracking_releases_update` — PUT /api/projects/{project_id}/error_tracking/releases/{id}/
- `error_tracking_releases_partial_update` — PATCH /api/projects/{project_id}/error_tracking/releases/{id}/
- `error_tracking_releases_destroy` — DELETE /api/projects/{project_id}/error_tracking/releases/{id}/
- `error_tracking_releases_hash_retrieve` — GET /api/projects/{project_id}/error_tracking/releases/hash/{hash_id}/
- `error_tracking_symbol_sets_list` — GET /api/projects/{project_id}/error_tracking/symbol_sets/
- `error_tracking_symbol_sets_retrieve` — GET /api/projects/{project_id}/error_tracking/symbol_sets/{id}/
- `error_tracking_symbol_sets_destroy` — DELETE /api/projects/{project_id}/error_tracking/symbol_sets/{id}/
- `error_tracking_symbol_sets_download_retrieve` — Return a presigned URL for downloading the symbol set's source map.
- `error_tracking_symbol_sets_finish_upload_update` — PUT /api/projects/{project_id}/error_tracking/symbol_sets/{id}/finish_upload/
- `error_tracking_symbol_sets_bulk_delete_create` — POST /api/projects/{project_id}/error_tracking/symbol_sets/bulk_delete/
- `error_tracking_symbol_sets_bulk_finish_upload_create` — POST /api/projects/{project_id}/error_tracking/symbol_sets/bulk_finish_upload/
- `error_tracking_symbol_sets_bulk_start_upload_create` — POST /api/projects/{project_id}/error_tracking/symbol_sets/bulk_start_upload/
- `event_definitions_list` — GET /api/projects/{project_id}/event_definitions/
- `event_definitions_create` — POST /api/projects/{project_id}/event_definitions/
- `event_definitions_retrieve` — GET /api/projects/{project_id}/event_definitions/{id}/
- `event_definitions_update` — PUT /api/projects/{project_id}/event_definitions/{id}/
- `event_definitions_partial_update` — PATCH /api/projects/{project_id}/event_definitions/{id}/
- `event_definitions_destroy` — DELETE /api/projects/{project_id}/event_definitions/{id}/
- `event_definitions_metrics_retrieve` — GET /api/projects/{project_id}/event_definitions/{id}/metrics/
- `event_definitions_bulk_update_tags_create` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `event_definitions_by_name_retrieve` — Get event definition by exact name
- `event_definitions_golang_retrieve` — GET /api/projects/{project_id}/event_definitions/golang/
- `event_definitions_primary_properties_retrieve` — Resolve team-configured primary properties for event definitions.

The response only contains entries where a non-null primary_property is set on the
EventDefinition. Callers should fall back to the core taxonomy defaults client-side
for names not present in the response.
- `event_definitions_python_retrieve` — GET /api/projects/{project_id}/event_definitions/python/
- `event_definitions_typescript_retrieve` — GET /api/projects/{project_id}/event_definitions/typescript/
- `event_schemas_list` — GET /api/projects/{project_id}/event_schemas/
- `event_schemas_create` — POST /api/projects/{project_id}/event_schemas/
- `event_schemas_update` — PUT /api/projects/{project_id}/event_schemas/{id}/
- `event_schemas_partial_update` — PATCH /api/projects/{project_id}/event_schemas/{id}/
- `event_schemas_destroy` — DELETE /api/projects/{project_id}/event_schemas/{id}/
- `events_list` — 
        This endpoint allows you to list and filter events.
        It is effectively deprecated and is kept only for backwards compatibility.
        If you ever ask about it you will be advised to not use it...
        If you want to ad-hoc list or aggregate events, use the Query endpoint instead.
        If you want to export all events or many pages of events you should use our CDP/Batch Exports products instead.
        
- `events_retrieve` — GET /api/projects/{project_id}/events/{id}/
- `events_values_retrieve` — GET /api/projects/{project_id}/events/values/
- `experiment_holdouts_list` — GET /api/projects/{project_id}/experiment_holdouts/
- `experiment_holdouts_create` — POST /api/projects/{project_id}/experiment_holdouts/
- `experiment_holdouts_retrieve` — GET /api/projects/{project_id}/experiment_holdouts/{id}/
- `experiment_holdouts_update` — PUT /api/projects/{project_id}/experiment_holdouts/{id}/
- `experiment_holdouts_partial_update` — PATCH /api/projects/{project_id}/experiment_holdouts/{id}/
- `experiment_holdouts_destroy` — DELETE /api/projects/{project_id}/experiment_holdouts/{id}/
- `experiment_saved_metrics_list` — GET /api/projects/{project_id}/experiment_saved_metrics/
- `experiment_saved_metrics_create` — POST /api/projects/{project_id}/experiment_saved_metrics/
- `experiment_saved_metrics_retrieve` — GET /api/projects/{project_id}/experiment_saved_metrics/{id}/
- `experiment_saved_metrics_update` — PUT /api/projects/{project_id}/experiment_saved_metrics/{id}/
- `experiment_saved_metrics_partial_update` — PATCH /api/projects/{project_id}/experiment_saved_metrics/{id}/
- `experiment_saved_metrics_destroy` — DELETE /api/projects/{project_id}/experiment_saved_metrics/{id}/
- `experiments_list` — List experiments for the current project. Supports filtering by status and archival state.
- `experiments_create` — Create a new experiment in draft status with optional metrics.
- `experiments_retrieve` — Retrieve a single experiment by ID, including its current status, metrics, feature flag, and results metadata.
- `experiments_update` — Mixin for ViewSets to handle ApprovalRequired exceptions from decorated serializers.

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `experiments_partial_update` — Update an experiment. Use this to modify experiment properties such as name, description, metrics, variants, and configuration. Metrics can be added, changed and removed at any time.
- `experiments_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `experiments_archive_create` — Archive an ended experiment.

Hides the experiment from the default list view. The experiment can be
restored at any time by updating archived=false. Returns 400 if the
experiment is already archived or has not ended yet.
- `experiments_copy_to_project_create` — Mixin for ViewSets to handle ApprovalRequired exceptions from decorated serializers.

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `experiments_create_exposure_cohort_for_experiment_create` — Mixin for ViewSets to handle ApprovalRequired exceptions from decorated serializers.

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `experiments_duplicate_create` — Mixin for ViewSets to handle ApprovalRequired exceptions from decorated serializers.

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `experiments_end_create` — End a running experiment without shipping a variant.

Sets end_date to now and marks the experiment as stopped. The feature
flag is NOT modified — users continue to see their assigned variants
and exposure events ($feature_flag_called) continue to be recorded.
However, only data up to end_date is included in experiment results.

Use this when:

- You want to freeze the results window without changing which variant
  users see.
- A variant was already shipped manually via the feature flag UI and
  the experiment just needs to be marked complete.

The end_date can be adjusted after ending via PATCH if it needs to be
backdated (e.g. to match when the flag was actually paused).

Other options:
- Use ship_variant to end the experiment AND roll out a single variant to 100%% of users.
- Use pause to deactivate the flag without ending the experiment (stops variant assignment but does not freeze results).

Returns 400 if the experiment is not running.
- `experiments_launch_create` — Launch a draft experiment.

Validates the experiment is in draft state, activates its linked feature flag,
sets start_date to the current server time, and transitions the experiment to running.
Returns 400 if the experiment has already been launched or if the feature flag
configuration is invalid (e.g. missing "control" variant or fewer than 2 variants).
- `experiments_pause_create` — Pause a running experiment.

Deactivates the linked feature flag so it is no longer returned by the
/decide endpoint. Users fall back to the application default (typically
the control experience), and no new exposure events are recorded (i.e.
$feature_flag_called is not fired).
Returns 400 if the experiment is not running or is already paused.
- `experiments_recalculate_timeseries_create` — Mixin for ViewSets to handle ApprovalRequired exceptions from decorated serializers.

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `experiments_reset_create` — Reset an experiment back to draft state.

Clears start/end dates, conclusion, and archived flag. The feature
flag is left unchanged — users continue to see their assigned variants.

Previously collected events still exist but won't be included in
results unless the start date is manually adjusted after re-launch.

Returns 400 if the experiment is already in draft state.
- `experiments_resume_create` — Resume a paused experiment.

Reactivates the linked feature flag so it is returned by /decide again.
Users are re-bucketed deterministically into the same variants they had
before the pause, and exposure tracking resumes.
Returns 400 if the experiment is not running or is not paused.
- `experiments_ship_variant_create` — Ship a variant and (optionally) end the experiment.

Updates the feature flag so the selected variant gets 100% of the variant
distribution. By default, existing release conditions on the flag are preserved
untouched — the variant is served only to users who already match them. Pass
``release_to_everyone: true`` to also prepend a catch-all release condition
that rolls the variant out to 100% of users (overrides any existing release
conditions on the flag).

Can be called on both running and stopped experiments. If the experiment is
still running, it will also be ended (end_date set and status marked as stopped).
If the experiment has already ended, only the flag is rewritten - this supports
the "end first, ship later" workflow.

If an approval policy requires review before changes on the flag take effect,
the API returns 409 with a change_request_id. The experiment is NOT ended until
the change request is approved and the user retries.

Returns 400 if the experiment is in draft state, the variant_key is not found
on the flag, or the experiment has no linked feature flag.
- `experiments_timeseries_results_retrieve` — Mixin for ViewSets to handle ApprovalRequired exceptions from decorated serializers.

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `experiments_unarchive_create` — Unarchive an archived experiment.

Restores the experiment to the default list view. Returns 400 if the
experiment is not currently archived.
- `experiments_create_from_prompt_create` — Create an experiment that compares N versions of an LLM prompt using a metric template.

The user picks 2+ versions of an existing LLMPrompt and 1+ metric templates
(cost / latency / eval_pass_rate). The endpoint builds the matching variants
(control + test-N, each named after its prompt version) and attaches one
metric per selected template, each scoped to the prompt's $ai_prompt_name.
Resulting experiment is in draft state.
- `experiments_eligible_feature_flags_retrieve` — Returns a paginated list of feature flags eligible for use in experiments.

Eligible flags must:
- Be multivariate with at least 2 variants
- Have "control" as the first variant key

Query parameters:
- search: Filter by flag key or name (case insensitive)
- limit: Number of results per page (default: 20)
- offset: Pagination offset (default: 0)
- active: Filter by active status ("true" or "false")
- created_by_id: Filter by creator user ID
- order: Sort order field
- evaluation_runtime: Filter by evaluation runtime
- has_evaluation_contexts: Filter by presence of evaluation contexts ("true" or "false")
- `experiments_prompt_templates_retrieve` — List the LLM metric templates that can be passed to `create_from_prompt`.
- `experiments_requires_flag_implementation_retrieve` — Mixin for ViewSets to handle ApprovalRequired exceptions from decorated serializers.

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `experiments_stats_retrieve` — Mixin for ViewSets to handle ApprovalRequired exceptions from decorated serializers.

This mixin intercepts ApprovalRequired exceptions raised by the @approval_gate decorator
on serializer methods and converts them into proper HTTP 409 Conflict responses with
change request details.
- `exports_list` — GET /api/projects/{project_id}/exports/
- `exports_create` — POST /api/projects/{project_id}/exports/
- `exports_retrieve` — GET /api/projects/{project_id}/exports/{id}/
- `exports_content_retrieve` — GET /api/projects/{project_id}/exports/{id}/content/
- `external_data_schemas_list` — GET /api/projects/{project_id}/external_data_schemas/
- `external_data_schemas_create` — POST /api/projects/{project_id}/external_data_schemas/
- `external_data_schemas_retrieve` — GET /api/projects/{project_id}/external_data_schemas/{id}/
- `external_data_schemas_update` — PUT /api/projects/{project_id}/external_data_schemas/{id}/
- `external_data_schemas_partial_update` — PATCH /api/projects/{project_id}/external_data_schemas/{id}/
- `external_data_schemas_destroy` — DELETE /api/projects/{project_id}/external_data_schemas/{id}/
- `external_data_schemas_cancel_create` — POST /api/projects/{project_id}/external_data_schemas/{id}/cancel/
- `external_data_schemas_delete_data_destroy` — DELETE /api/projects/{project_id}/external_data_schemas/{id}/delete_data/
- `external_data_schemas_incremental_fields_create` — POST /api/projects/{project_id}/external_data_schemas/{id}/incremental_fields/
- `external_data_schemas_reload_create` — POST /api/projects/{project_id}/external_data_schemas/{id}/reload/
- `external_data_schemas_resync_create` — POST /api/projects/{project_id}/external_data_schemas/{id}/resync/
- `external_data_sources_list` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_create` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_retrieve` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_update` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_partial_update` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_destroy` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_bulk_update_schemas_partial_update` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_create_webhook_create` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_delete_webhook_create` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_jobs_retrieve` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_refresh_schemas_create` — Fetch current schema/table list from the source and create any new ExternalDataSchema rows (no data sync).
- `external_data_sources_reload_create` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_revenue_analytics_config_partial_update` — Update the revenue analytics configuration and return the full external data source.
- `external_data_sources_update_webhook_inputs_create` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_webhook_info_retrieve` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_check_cdc_prerequisites_create` — Validate CDC prerequisites against a live Postgres connection.

Used by the source wizard to surface ✅/❌ checks before source creation,
and by the self-managed setup popup to verify user-created publications.
- `external_data_sources_connections_list` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_database_schema_create` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_source_prefix_create` — Create, Read, Update and Delete External data Sources.
- `external_data_sources_wizard_retrieve` — Create, Read, Update and Delete External data Sources.
- `feature_flags_list` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_create` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_retrieve` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_update` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_partial_update` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `feature_flags_activity_retrieve` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_create_static_cohort_for_flag_create` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_dashboard_create` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_dependent_flags_list` — Get other active flags that depend on this flag.
- `feature_flags_enrich_usage_dashboard_create` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_remote_config_retrieve` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_status_retrieve` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_test_evaluation_create` — Test feature flag evaluation against a specific user at an optional point in time.

This endpoint allows testing how a feature flag would evaluate for a specific user,
optionally at a historical timestamp. When a timestamp is provided, both the flag
conditions and person properties are evaluated as they existed at that time.
- `feature_flags_versions_retrieve` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_all_activity_retrieve` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_bulk_delete_create` — Bulk delete feature flags by filter criteria or explicit IDs.

Accepts either:
- {"filters": {...}} - Same filter params as list endpoint (search, active, type, etc.)
- {"ids": [...]} - Explicit list of flag IDs (no limit)

Returns same format as bulk_delete for UI compatibility.

Uses bulk operations for efficiency: database updates are batched and cache
invalidation happens once at the end rather than per-flag.
- `feature_flags_bulk_keys_create` — Get feature flag keys by IDs.
Accepts a list of feature flag IDs and returns a mapping of ID to key.
- `feature_flags_bulk_update_tags_create` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `feature_flags_evaluation_reasons_retrieve` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_local_evaluation_retrieve` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_matching_ids_retrieve` — Get IDs of all feature flags matching the current filters.
Uses the same filtering logic as the list endpoint.
Returns only IDs that the user has permission to edit.
- `feature_flags_my_flags_retrieve` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `feature_flags_user_blast_radius_create` — Create, read, update and delete feature flags. [See docs](https://posthog.com/docs/feature-flags) for more information on feature flags.

If you're looking to use feature flags on your application, you can either use our JavaScript Library or our dedicated endpoint to check if feature flags are enabled for a given user.
- `file_download_batch_exports_list` — GET /api/projects/{project_id}/file_download_batch_exports/
- `file_download_batch_exports_create` — Create and start a batch export on demand run to download a file.
- `file_download_batch_exports_retrieve` — Get a batch export on demand run.

If the underlying batch export run has completed, we return keys to the
generated file downloads so that users may download them by making a request
to /download.
- `file_download_batch_exports_cancel_create` — Cancel an ongoing file-download batch export.
- `file_download_batch_exports_download_retrieve` — Download a file (or a part) from this batch export run.

Users can provide a part component with an id or index, or no part component at
all:
* If part id is included: The file download matching the id is downloaded.
* If part index is included: The file download matching the index (as ordered
    by key) is downloaded.
* If no part component is present: If there is only one file downloaded, that
    is downloaded. Otherwise the first one as sorted by key is downloaded.
- `file_download_batch_exports_logs_retrieve` — GET /api/projects/{project_id}/file_download_batch_exports/{id}/logs/
- `file_system_list` — GET /api/projects/{project_id}/file_system/
- `file_system_create` — POST /api/projects/{project_id}/file_system/
- `file_system_retrieve` — GET /api/projects/{project_id}/file_system/{id}/
- `file_system_update` — PUT /api/projects/{project_id}/file_system/{id}/
- `file_system_partial_update` — PATCH /api/projects/{project_id}/file_system/{id}/
- `file_system_destroy` — DELETE /api/projects/{project_id}/file_system/{id}/
- `file_system_count_create` — Get count of all files in a folder.
- `file_system_link_create` — POST /api/projects/{project_id}/file_system/{id}/link/
- `file_system_move_create` — POST /api/projects/{project_id}/file_system/{id}/move/
- `file_system_count_by_path_create` — Get count of all files in a folder.
- `file_system_log_view_retrieve` — GET /api/projects/{project_id}/file_system/log_view/
- `file_system_log_view_create` — POST /api/projects/{project_id}/file_system/log_view/
- `file_system_undo_delete_create` — POST /api/projects/{project_id}/file_system/undo_delete/
- `file_system_unfiled_retrieve` — GET /api/projects/{project_id}/file_system/unfiled/
- `file_system_shortcut_list` — GET /api/projects/{project_id}/file_system_shortcut/
- `file_system_shortcut_create` — POST /api/projects/{project_id}/file_system_shortcut/
- `file_system_shortcut_retrieve` — GET /api/projects/{project_id}/file_system_shortcut/{id}/
- `file_system_shortcut_update` — PUT /api/projects/{project_id}/file_system_shortcut/{id}/
- `file_system_shortcut_partial_update` — PATCH /api/projects/{project_id}/file_system_shortcut/{id}/
- `file_system_shortcut_destroy` — DELETE /api/projects/{project_id}/file_system_shortcut/{id}/
- `file_system_shortcut_reorder_create` — Set the display order of the current user's shortcuts. `ordered_ids` becomes the new top-to-bottom order; any unknown IDs are rejected.
- `flag_value_values_retrieve` — Get possible values for a feature flag.

Query parameters:
- key: The flag ID (required)
Returns:

- Array of objects with 'name' field containing possible values
- `groups_list` — List all groups of a specific group type. You must pass ?group_type_index= in the URL.
To get a list of valid group types, call /api/:project_id/groups_types/.

Uses forward-only keyset pagination via the `cursor` parameter.
The `previous` field in the response envelope is always null.
- `groups_create` — POST /api/projects/{project_id}/groups/
- `groups_activity_retrieve` — GET /api/projects/{project_id}/groups/activity/
- `groups_delete_property_create` — POST /api/projects/{project_id}/groups/delete_property/
- `groups_find_retrieve` — GET /api/projects/{project_id}/groups/find/
- `groups_property_definitions_retrieve` — GET /api/projects/{project_id}/groups/property_definitions/
- `groups_property_values_retrieve` — GET /api/projects/{project_id}/groups/property_values/
- `groups_related_retrieve` — GET /api/projects/{project_id}/groups/related/
- `groups_update_property_create` — POST /api/projects/{project_id}/groups/update_property/
- `groups_types_list` — GET /api/projects/{project_id}/groups_types/
- `groups_types_destroy` — DELETE /api/projects/{project_id}/groups_types/{group_type_index}/
- `groups_types_metrics_list` — GET /api/projects/{project_id}/groups_types/{group_type_index}/metrics/
- `groups_types_metrics_create` — POST /api/projects/{project_id}/groups_types/{group_type_index}/metrics/
- `groups_types_metrics_retrieve` — GET /api/projects/{project_id}/groups_types/{group_type_index}/metrics/{id}/
- `groups_types_metrics_update` — PUT /api/projects/{project_id}/groups_types/{group_type_index}/metrics/{id}/
- `groups_types_metrics_partial_update` — PATCH /api/projects/{project_id}/groups_types/{group_type_index}/metrics/{id}/
- `groups_types_metrics_destroy` — DELETE /api/projects/{project_id}/groups_types/{group_type_index}/metrics/{id}/
- `groups_types_create_detail_dashboard_update` — PUT /api/projects/{project_id}/groups_types/create_detail_dashboard/
- `groups_types_set_default_columns_update` — PUT /api/projects/{project_id}/groups_types/set_default_columns/
- `groups_types_update_metadata_partial_update` — PATCH /api/projects/{project_id}/groups_types/update_metadata/
- `heatmap_screenshots_content_retrieve` — GET /api/projects/{project_id}/heatmap_screenshots/{id}/content/
- `heatmaps_list` — GET /api/projects/{project_id}/heatmaps/
- `heatmaps_events_retrieve` — GET /api/projects/{project_id}/heatmaps/events/
- `hog_flows_list` — GET /api/projects/{project_id}/hog_flows/
- `hog_flows_create` — POST /api/projects/{project_id}/hog_flows/
- `hog_flows_retrieve` — GET /api/projects/{project_id}/hog_flows/{id}/
- `hog_flows_update` — PUT /api/projects/{project_id}/hog_flows/{id}/
- `hog_flows_partial_update` — PATCH /api/projects/{project_id}/hog_flows/{id}/
- `hog_flows_destroy` — DELETE /api/projects/{project_id}/hog_flows/{id}/
- `hog_flows_batch_jobs_retrieve` — GET /api/projects/{project_id}/hog_flows/{id}/batch_jobs/
- `hog_flows_batch_jobs_create` — POST /api/projects/{project_id}/hog_flows/{id}/batch_jobs/
- `hog_flows_invocations_create` — POST /api/projects/{project_id}/hog_flows/{id}/invocations/
- `hog_flows_logs_retrieve` — GET /api/projects/{project_id}/hog_flows/{id}/logs/
- `hog_flows_metrics_retrieve` — GET /api/projects/{project_id}/hog_flows/{id}/metrics/
- `hog_flows_metrics_totals_retrieve` — GET /api/projects/{project_id}/hog_flows/{id}/metrics/totals/
- `hog_flows_schedules_list` — GET /api/projects/{project_id}/hog_flows/{id}/schedules/
- `hog_flows_schedules_create` — POST /api/projects/{project_id}/hog_flows/{id}/schedules/
- `hog_flows_schedules_partial_update` — PATCH /api/projects/{project_id}/hog_flows/{id}/schedules/{schedule_id}/
- `hog_flows_schedules_destroy` — DELETE /api/projects/{project_id}/hog_flows/{id}/schedules/{schedule_id}/
- `hog_flows_bulk_delete_create` — POST /api/projects/{project_id}/hog_flows/bulk_delete/
- `hog_flows_user_blast_radius_create` — POST /api/projects/{project_id}/hog_flows/user_blast_radius/
- `hog_function_templates_list` — GET /api/projects/{project_id}/hog_function_templates/
- `hog_function_templates_retrieve` — GET /api/projects/{project_id}/hog_function_templates/{template_id}/
- `hog_functions_list` — GET /api/projects/{project_id}/hog_functions/
- `hog_functions_create` — POST /api/projects/{project_id}/hog_functions/
- `hog_functions_retrieve` — GET /api/projects/{project_id}/hog_functions/{id}/
- `hog_functions_update` — PUT /api/projects/{project_id}/hog_functions/{id}/
- `hog_functions_partial_update` — PATCH /api/projects/{project_id}/hog_functions/{id}/
- `hog_functions_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `hog_functions_enable_backfills_create` — POST /api/projects/{project_id}/hog_functions/{id}/enable_backfills/
- `hog_functions_invocations_create` — POST /api/projects/{project_id}/hog_functions/{id}/invocations/
- `hog_functions_logs_retrieve` — GET /api/projects/{project_id}/hog_functions/{id}/logs/
- `hog_functions_metrics_retrieve` — GET /api/projects/{project_id}/hog_functions/{id}/metrics/
- `hog_functions_metrics_totals_retrieve` — GET /api/projects/{project_id}/hog_functions/{id}/metrics/totals/
- `hog_functions_icon_retrieve` — GET /api/projects/{project_id}/hog_functions/icon/
- `hog_functions_icons_retrieve` — GET /api/projects/{project_id}/hog_functions/icons/
- `hog_functions_rearrange_partial_update` — Update the execution order of multiple HogFunctions.
- `insight_variables_list` — GET /api/projects/{project_id}/insight_variables/
- `insight_variables_create` — POST /api/projects/{project_id}/insight_variables/
- `insight_variables_retrieve` — GET /api/projects/{project_id}/insight_variables/{id}/
- `insight_variables_update` — PUT /api/projects/{project_id}/insight_variables/{id}/
- `insight_variables_partial_update` — PATCH /api/projects/{project_id}/insight_variables/{id}/
- `insight_variables_destroy` — DELETE /api/projects/{project_id}/insight_variables/{id}/
- `insights_list` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `insights_create` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `insights_sharing_list` — GET /api/projects/{project_id}/insights/{insight_id}/sharing/
- `insights_sharing_passwords_create` — Create a new password for the sharing configuration.
- `insights_sharing_passwords_destroy` — Delete a password from the sharing configuration.
- `insights_sharing_refresh_create` — POST /api/projects/{project_id}/insights/{insight_id}/sharing/refresh/
- `insights_thresholds_list` — GET /api/projects/{project_id}/insights/{insight_id}/thresholds/
- `insights_thresholds_retrieve` — GET /api/projects/{project_id}/insights/{insight_id}/thresholds/{id}/
- `insights_retrieve` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `insights_update` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `insights_partial_update` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `insights_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `insights_activity_retrieve` — Audit trail for a single insight — every change made to it, by whom, and when. Use this when you want the change history of a specific insight; use the project-wide activity endpoint for a broader view.
- `insights_analyze_retrieve` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `insights_suggestions_retrieve` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `insights_suggestions_create` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `insights_all_activity_retrieve` — Project-wide audit trail across all insights — who created, edited, deleted, or restored insights, what changed (with before/after diffs), and when. Useful for surfacing what people (or agents) have been working on recently.
- `insights_bulk_update_tags_create` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `insights_cancel_create` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `insights_generate_metadata_create` — Generate an AI-suggested name and description for an insight based on its query configuration.
- `insights_my_last_viewed_retrieve` — Returns basic details about the last 5 insights viewed by this user. Most recently viewed first.
- `insights_trending_retrieve` — Returns insights ranked by view count over the last N days (default 7), highest first. Each result includes the same metadata as the standard insights list, plus a `view_count` and up to 3 recent `viewers`. Useful for surfacing the most-used insights in a project.
- `insights_viewed_create` — Record that the current user has just viewed one or more insights. Submitted ids that do not belong to the current project or that point at deleted insights are silently dropped. Returns 201 on success regardless of how many ids were retained.
- `integrations_list` — GET /api/projects/{project_id}/integrations/
- `integrations_create` — POST /api/projects/{project_id}/integrations/
- `integrations_retrieve` — GET /api/projects/{project_id}/integrations/{id}/
- `integrations_destroy` — DELETE /api/projects/{project_id}/integrations/{id}/
- `integrations_anthropic_managed_agent_envs_retrieve` — GET /api/projects/{project_id}/integrations/{id}/anthropic_managed_agent_environments/
- `integrations_anthropic_managed_agent_vaults_retrieve` — GET /api/projects/{project_id}/integrations/{id}/anthropic_managed_agent_vaults/
- `integrations_anthropic_managed_agents_retrieve` — GET /api/projects/{project_id}/integrations/{id}/anthropic_managed_agents/
- `integrations_channels_retrieve` — GET /api/projects/{project_id}/integrations/{id}/channels/
- `integrations_clickup_lists_retrieve` — GET /api/projects/{project_id}/integrations/{id}/clickup_lists/
- `integrations_clickup_spaces_retrieve` — GET /api/projects/{project_id}/integrations/{id}/clickup_spaces/
- `integrations_clickup_workspaces_retrieve` — GET /api/projects/{project_id}/integrations/{id}/clickup_workspaces/
- `integrations_email_partial_update` — PATCH /api/projects/{project_id}/integrations/{id}/email/
- `integrations_email_verify_create` — POST /api/projects/{project_id}/integrations/{id}/email/verify/
- `integrations_github_branches_retrieve` — GET /api/projects/{project_id}/integrations/{id}/github_branches/
- `integrations_github_repos_retrieve` — GET /api/projects/{project_id}/integrations/{id}/github_repos/
- `integrations_github_repos_refresh_create` — POST /api/projects/{project_id}/integrations/{id}/github_repos/refresh/
- `integrations_github_teams_retrieve` — GET /api/projects/{project_id}/integrations/{id}/github_teams/
- `integrations_google_accessible_accounts_retrieve` — GET /api/projects/{project_id}/integrations/{id}/google_accessible_accounts/
- `integrations_google_conversion_actions_retrieve` — GET /api/projects/{project_id}/integrations/{id}/google_conversion_actions/
- `integrations_jira_projects_retrieve` — GET /api/projects/{project_id}/integrations/{id}/jira_projects/
- `integrations_linear_teams_retrieve` — GET /api/projects/{project_id}/integrations/{id}/linear_teams/
- `integrations_linkedin_ads_accounts_retrieve` — GET /api/projects/{project_id}/integrations/{id}/linkedin_ads_accounts/
- `integrations_linkedin_ads_conversion_rules_retrieve` — GET /api/projects/{project_id}/integrations/{id}/linkedin_ads_conversion_rules/
- `integrations_twilio_phone_numbers_retrieve` — GET /api/projects/{project_id}/integrations/{id}/twilio_phone_numbers/
- `integrations_authorize_retrieve` — GET /api/projects/{project_id}/integrations/authorize/
- `integrations_domain_connect_apply_url_create` — Unified endpoint for generating Domain Connect apply URLs.

Accepts a context ("email" or "proxy") and the relevant resource ID.
The backend resolves the domain, template variables, and service ID
based on context, then builds the signed apply URL.
- `integrations_domain_connect_check_retrieve` — GET /api/projects/{project_id}/integrations/domain-connect/check/
- `integrations_github_link_existing_create` — Reuse a GitHub installation already linked to a sibling team in the same organization.
- `integrations_github_oauth_authorize_create` — Mint a User OAuth URL to bootstrap a fresh `code` when the install flow returns without one.
- `js_snippet_resolve_retrieve` — Preview what a given pin would resolve to, without saving it.
- `js_snippet_version_retrieve` — Return the team's current version pin and resolved version.
- `js_snippet_version_partial_update` — Update the team's version pin.
- `live_debugger_breakpoints_list` — Create, Read, Update and Delete breakpoints for live debugging.
- `live_debugger_breakpoints_create` — Create, Read, Update and Delete breakpoints for live debugging.
- `live_debugger_breakpoints_retrieve` — Create, Read, Update and Delete breakpoints for live debugging.
- `live_debugger_breakpoints_update` — Create, Read, Update and Delete breakpoints for live debugging.
- `live_debugger_breakpoints_partial_update` — Create, Read, Update and Delete breakpoints for live debugging.
- `live_debugger_breakpoints_destroy` — Create, Read, Update and Delete breakpoints for live debugging.
- `live_debugger_breakpoints_active_retrieve` — Get active breakpoints (External API)
- `live_debugger_breakpoints_breakpoint_hits_retrieve` — Get breakpoint hits
- `logs_alerts_list` — GET /api/projects/{project_id}/logs/alerts/
- `logs_alerts_create` — POST /api/projects/{project_id}/logs/alerts/
- `logs_alerts_retrieve` — GET /api/projects/{project_id}/logs/alerts/{id}/
- `logs_alerts_update` — PUT /api/projects/{project_id}/logs/alerts/{id}/
- `logs_alerts_partial_update` — PATCH /api/projects/{project_id}/logs/alerts/{id}/
- `logs_alerts_destroy` — DELETE /api/projects/{project_id}/logs/alerts/{id}/
- `logs_alerts_destinations_create` — Create a notification destination for this alert. One HogFunction is created per alert event kind (firing, resolved, ...) atomically.
- `logs_alerts_destinations_delete_create` — Delete a notification destination by deleting its HogFunction group atomically.
- `logs_alerts_events_list` — Paginated event history for this alert, newest first. Returns state transitions, errored checks, and user-initiated control-plane rows (reset, enable/disable, snooze/unsnooze, threshold change) — quiet no-op check rows (where state didn't change and there was no error) are filtered out since only the last 10 are kept and they carry no forensic value. Optional `?kind=...` narrows to a single kind.
- `logs_alerts_reset_create` — Reset a broken alert. Clears the consecutive-failure counter and schedules an immediate recheck.
- `logs_alerts_simulate_create` — Simulate a logs alert on historical data using the full state machine. Read-only — no alert check records are created.
- `logs_attributes_retrieve` — GET /api/projects/{project_id}/logs/attributes/
- `logs_count_create` — POST /api/projects/{project_id}/logs/count/
- `logs_count_ranges_create` — POST /api/projects/{project_id}/logs/count-ranges/
- `logs_export_create` — POST /api/projects/{project_id}/logs/export/
- `logs_has_logs_retrieve` — GET /api/projects/{project_id}/logs/has_logs/
- `logs_query_create` — POST /api/projects/{project_id}/logs/query/
- `logs_sampling_rules_list` — GET /api/projects/{project_id}/logs/sampling_rules/
- `logs_sampling_rules_create` — POST /api/projects/{project_id}/logs/sampling_rules/
- `logs_sampling_rules_retrieve` — GET /api/projects/{project_id}/logs/sampling_rules/{id}/
- `logs_sampling_rules_update` — PUT /api/projects/{project_id}/logs/sampling_rules/{id}/
- `logs_sampling_rules_partial_update` — PATCH /api/projects/{project_id}/logs/sampling_rules/{id}/
- `logs_sampling_rules_destroy` — DELETE /api/projects/{project_id}/logs/sampling_rules/{id}/
- `logs_sampling_rules_simulate_create` — Dry-run estimate for how much volume this rule would remove (placeholder response until CH-backed simulation is wired).
- `logs_sampling_rules_reorder_create` — Atomically reassign priorities so the given ID order maps to ascending priorities (0..n-1).
- `logs_services_create` — POST /api/projects/{project_id}/logs/services/
- `logs_sparkline_create` — POST /api/projects/{project_id}/logs/sparkline/
- `logs_values_retrieve` — GET /api/projects/{project_id}/logs/values/
- `metrics_has_metrics_retrieve` — GET /api/projects/{project_id}/metrics/has_metrics/
- `metrics_query_create` — POST /api/projects/{project_id}/metrics/query/
- `metrics_values_retrieve` — Distinct metric names for the team. Backs the picker UI.
- `notebooks_list` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_create` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_sharing_list` — GET /api/projects/{project_id}/notebooks/{notebook_id}/sharing/
- `notebooks_sharing_passwords_create` — Create a new password for the sharing configuration.
- `notebooks_sharing_passwords_destroy` — Delete a password from the sharing configuration.
- `notebooks_sharing_refresh_create` — POST /api/projects/{project_id}/notebooks/{notebook_id}/sharing/refresh/
- `notebooks_retrieve` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_update` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_partial_update` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `notebooks_activity_retrieve` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_collab_save_create` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_collab_stream_retrieve` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_hogql_execute_create` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_kernel_config_create` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_kernel_dataframe_retrieve` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_kernel_execute_create` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_kernel_execute_stream_create` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_kernel_restart_create` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_kernel_start_create` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_kernel_status_retrieve` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_kernel_stop_create` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_all_activity_retrieve` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `notebooks_recording_comments_retrieve` — The API for interacting with Notebooks. This feature is in early access and the API can have breaking changes without announcement.
- `object_media_previews_list` — GET /api/projects/{project_id}/object_media_previews/
- `object_media_previews_create` — POST /api/projects/{project_id}/object_media_previews/
- `object_media_previews_retrieve` — GET /api/projects/{project_id}/object_media_previews/{id}/
- `object_media_previews_update` — PUT /api/projects/{project_id}/object_media_previews/{id}/
- `object_media_previews_partial_update` — PATCH /api/projects/{project_id}/object_media_previews/{id}/
- `object_media_previews_destroy` — DELETE /api/projects/{project_id}/object_media_previews/{id}/
- `object_media_previews_preferred_for_event_retrieve` — Get the preferred media preview for an event definition.
Most recent user-uploaded, then most recent exported asset.
Requires event_definition (query param).
- `persisted_folder_list` — GET /api/projects/{project_id}/persisted_folder/
- `persisted_folder_create` — POST /api/projects/{project_id}/persisted_folder/
- `persisted_folder_retrieve` — GET /api/projects/{project_id}/persisted_folder/{id}/
- `persisted_folder_update` — PUT /api/projects/{project_id}/persisted_folder/{id}/
- `persisted_folder_partial_update` — PATCH /api/projects/{project_id}/persisted_folder/{id}/
- `persisted_folder_destroy` — DELETE /api/projects/{project_id}/persisted_folder/{id}/
- `persons_list` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_update` — Only for setting properties on the person. "properties" from the request data will be updated via a "$set" event.
This means that only the properties listed will be updated, but other properties won't be removed nor updated.
If you would like to remove a property use the `delete_property` endpoint.
- `persons_partial_update` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_activity_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_delete_property_create` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_properties_timeline_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_split_create` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_update_property_create` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_all_activity_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_batch_by_distinct_ids_create` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_batch_by_uuids_create` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_bulk_delete_create` — This endpoint allows you to bulk delete persons, either by the PostHog person IDs or by distinct IDs. You can pass in a maximum of 1000 IDs per call. Only events captured before the request will be deleted.
- `persons_cohorts_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_deletion_status_list` — List the status of queued event deletions for persons. When you delete a person with `delete_events=true`, an async deletion is queued. Use this endpoint to check whether those deletions are still pending or have been completed.
- `persons_funnel_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_funnel_create` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_funnel_correlation_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_funnel_correlation_create` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_lifecycle_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_properties_at_time_retrieve` — Get person properties as they existed at a specific point in time.

This endpoint reconstructs person properties by querying ClickHouse events
for $set and $set_once operations up to the specified timestamp.

Query parameters:
- distinct_id: The distinct_id of the person
- timestamp: ISO datetime string for the point in time (e.g., "2023-06-15T14:30:00Z")
- include_set_once: Whether to handle $set_once operations (default: false)
- `persons_reset_person_distinct_id_create` — Reset a distinct_id for a deleted person. This allows the distinct_id to be used again.
- `persons_trends_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `persons_values_retrieve` — This endpoint is meant for reading and deleting persons. To create or update persons, we recommend using the [capture API](https://posthog.com/docs/api/capture), the `$set` and `$unset` [properties](https://posthog.com/docs/product-analytics/user-properties), or one of our SDKs.
- `plugin_configs_logs_list` — GET /api/projects/{project_id}/plugin_configs/{plugin_config_id}/logs/
- `product_tours_list` — GET /api/projects/{project_id}/product_tours/
- `product_tours_create` — POST /api/projects/{project_id}/product_tours/
- `product_tours_retrieve` — GET /api/projects/{project_id}/product_tours/{id}/
- `product_tours_update` — PUT /api/projects/{project_id}/product_tours/{id}/
- `product_tours_partial_update` — PATCH /api/projects/{project_id}/product_tours/{id}/
- `product_tours_destroy` — DELETE /api/projects/{project_id}/product_tours/{id}/
- `product_tours_discard_draft_destroy` — Discard draft content.
- `product_tours_draft_partial_update` — Save draft content (server-side merge). No side effects triggered.
- `product_tours_draft_status_retrieve` — Lightweight polling endpoint for draft change detection.
- `product_tours_generate_create` — Generate tour step content using AI.
- `product_tours_publish_draft_create` — Commit draft to live tour. Runs full validation and triggers side effects.

Accepts an optional body payload. If provided, merges it into the draft
before publishing so the caller can save + publish in a single request.
- `project_secret_api_keys_list` — GET /api/projects/{project_id}/project_secret_api_keys/
- `project_secret_api_keys_create` — POST /api/projects/{project_id}/project_secret_api_keys/
- `project_secret_api_keys_retrieve` — GET /api/projects/{project_id}/project_secret_api_keys/{id}/
- `project_secret_api_keys_update` — PUT /api/projects/{project_id}/project_secret_api_keys/{id}/
- `project_secret_api_keys_partial_update` — PATCH /api/projects/{project_id}/project_secret_api_keys/{id}/
- `project_secret_api_keys_destroy` — DELETE /api/projects/{project_id}/project_secret_api_keys/{id}/
- `project_secret_api_keys_roll_create` — Roll a project secret API key
- `property_definitions_list` — GET /api/projects/{project_id}/property_definitions/
- `property_definitions_retrieve` — GET /api/projects/{project_id}/property_definitions/{id}/
- `property_definitions_update` — PUT /api/projects/{project_id}/property_definitions/{id}/
- `property_definitions_partial_update` — PATCH /api/projects/{project_id}/property_definitions/{id}/
- `property_definitions_destroy` — DELETE /api/projects/{project_id}/property_definitions/{id}/
- `property_definitions_bulk_update_tags_create` — Bulk update tags on multiple objects.

PAT access: this action has no ``required_scopes=`` on the decorator —
inheriting viewsets must add ``"bulk_update_tags"`` to their
``scope_object_write_actions`` list to accept personal API keys.
Without that opt-in, ``APIScopePermission`` rejects PAT requests with
"This action does not support personal API key access". Done per-viewset
so granting ``<scope>:write`` for one resource doesn't leak access to
sibling resources that share this mixin.

Accepts:
- {"ids": [...], "action": "add"|"remove"|"set", "tags": ["tag1", "tag2"]}

Actions:
- "add": Add tags to existing tags on each object
- "remove": Remove specific tags from each object
- "set": Replace all tags on each object with the provided list
- `property_definitions_seen_together_retrieve` — Allows a caller to provide a list of event names and a single property name
Returns a map of the event names to a boolean representing whether that property has ever been seen with that event_name
- `query_create` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `query_retrieve` — (Experimental)
- `query_destroy` — (Experimental)
- `query_log_retrieve` — Get query log details from query_log_archive table for a specific query_id, the query must have been issued in last 24 hours.
- `query_create_with_kind` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `query_check_auth_for_async_create` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `query_draft_sql_retrieve` — DRF ViewSet mixin that gates coalesced responses behind permission checks.

The QueryCoalescingMiddleware attaches cached response data to
request.META["_coalesced_response"] for followers. This mixin runs DRF's
initial() (auth + permissions + throttling) before returning the
cached response, ensuring the request is authorized.
- `query_upgrade_create` — Upgrades a query without executing it. Returns a query with all nodes migrated to the latest version.
- `quota_limits_list` — Get a team's quota-limit state
- `sandbox_list` — API for managing sandbox environments that control network access for task runs.
- `sandbox_create` — API for managing sandbox environments that control network access for task runs.
- `sandbox_retrieve` — API for managing sandbox environments that control network access for task runs.
- `sandbox_partial_update` — API for managing sandbox environments that control network access for task runs.
- `sandbox_destroy` — API for managing sandbox environments that control network access for task runs.
- `saved_list` — GET /api/projects/{project_id}/saved/
- `saved_create` — POST /api/projects/{project_id}/saved/
- `saved_retrieve` — GET /api/projects/{project_id}/saved/{short_id}/
- `saved_partial_update` — PATCH /api/projects/{project_id}/saved/{short_id}/
- `saved_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `saved_regenerate_create` — POST /api/projects/{project_id}/saved/{short_id}/regenerate/
- `schema_property_groups_list` — GET /api/projects/{project_id}/schema_property_groups/
- `schema_property_groups_create` — POST /api/projects/{project_id}/schema_property_groups/
- `schema_property_groups_retrieve` — GET /api/projects/{project_id}/schema_property_groups/{id}/
- `schema_property_groups_update` — PUT /api/projects/{project_id}/schema_property_groups/{id}/
- `schema_property_groups_partial_update` — PATCH /api/projects/{project_id}/schema_property_groups/{id}/
- `schema_property_groups_destroy` — DELETE /api/projects/{project_id}/schema_property_groups/{id}/
- `sdk_doctor_report_retrieve` — Get SDK health report for a project
- `session_group_summaries_list` — API for retrieving and managing stored group session summaries.
- `session_group_summaries_create` — API for retrieving and managing stored group session summaries.
- `session_group_summaries_retrieve` — API for retrieving and managing stored group session summaries.
- `session_group_summaries_update` — API for retrieving and managing stored group session summaries.
- `session_group_summaries_partial_update` — API for retrieving and managing stored group session summaries.
- `session_group_summaries_destroy` — API for retrieving and managing stored group session summaries.
- `session_recording_playlists_list` — Override list to include synthetic playlists
- `session_recording_playlists_create` — POST /api/projects/{project_id}/session_recording_playlists/
- `session_recording_playlists_retrieve` — GET /api/projects/{project_id}/session_recording_playlists/{short_id}/
- `session_recording_playlists_update` — PUT /api/projects/{project_id}/session_recording_playlists/{short_id}/
- `session_recording_playlists_partial_update` — PATCH /api/projects/{project_id}/session_recording_playlists/{short_id}/
- `session_recording_playlists_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `session_recording_playlists_recordings_retrieve` — GET /api/projects/{project_id}/session_recording_playlists/{short_id}/recordings/
- `session_recording_playlists_recordings_create` — POST /api/projects/{project_id}/session_recording_playlists/{short_id}/recordings/{session_recording_id}/
- `session_recording_playlists_recordings_destroy` — DELETE /api/projects/{project_id}/session_recording_playlists/{short_id}/recordings/{session_recording_id}/
- `session_recordings_list` — GET /api/projects/{project_id}/session_recordings/
- `session_recordings_retrieve` — GET /api/projects/{project_id}/session_recordings/{id}/
- `session_recordings_update` — PUT /api/projects/{project_id}/session_recordings/{id}/
- `session_recordings_partial_update` — PATCH /api/projects/{project_id}/session_recordings/{id}/
- `session_recordings_destroy` — DELETE /api/projects/{project_id}/session_recordings/{id}/
- `session_recordings_sharing_list` — GET /api/projects/{project_id}/session_recordings/{recording_id}/sharing/
- `session_recordings_sharing_passwords_create` — Create a new password for the sharing configuration.
- `session_recordings_sharing_passwords_destroy` — Delete a password from the sharing configuration.
- `session_recordings_sharing_refresh_create` — POST /api/projects/{project_id}/session_recordings/{recording_id}/sharing/refresh/
- `sessions_property_definitions_retrieve` — GET /api/projects/{project_id}/sessions/property_definitions/
- `sessions_values_retrieve` — GET /api/projects/{project_id}/sessions/values/
- `signals_processing_list` — Return current processing state including pause status.
- `signals_processing_pause_update` — View and control signal processing pipeline state for a team.
- `signals_processing_pause_destroy` — View and control signal processing pipeline state for a team.
- `signals_reports_list` — GET /api/projects/{project_id}/signals/reports/
- `signals_reports_retrieve` — GET /api/projects/{project_id}/signals/reports/{id}/
- `signals_scout_project_profile_get` — Get the current project profile
- `signals_scout_runs_list` — Search recent agent runs
- `signals_scout_runs_retrieve` — Get a run by ID
- `signals_scout_emit_signal` — Emit a finding for a run
- `signals_scout_scratchpad_search` — Search the scout scratchpad
- `signals_scout_scratchpad_remember` — Remember a scratchpad entry
- `signals_scout_scratchpad_forget` — Forget a scratchpad entry by key
- `signals_source_configs_list` — GET /api/projects/{project_id}/signals/source_configs/
- `signals_source_configs_create` — POST /api/projects/{project_id}/signals/source_configs/
- `signals_source_configs_retrieve` — GET /api/projects/{project_id}/signals/source_configs/{id}/
- `signals_source_configs_update` — PUT /api/projects/{project_id}/signals/source_configs/{id}/
- `signals_source_configs_partial_update` — PATCH /api/projects/{project_id}/signals/source_configs/{id}/
- `signals_source_configs_destroy` — DELETE /api/projects/{project_id}/signals/source_configs/{id}/
- `subscriptions_list` — GET /api/projects/{project_id}/subscriptions/
- `subscriptions_create` — POST /api/projects/{project_id}/subscriptions/
- `subscriptions_retrieve` — GET /api/projects/{project_id}/subscriptions/{id}/
- `subscriptions_update` — PUT /api/projects/{project_id}/subscriptions/{id}/
- `subscriptions_partial_update` — PATCH /api/projects/{project_id}/subscriptions/{id}/
- `subscriptions_destroy` — Hard delete of this model is not allowed. Use a patch API call to set "deleted" to true
- `subscriptions_test_delivery_create` — POST /api/projects/{project_id}/subscriptions/{id}/test-delivery/
- `subscriptions_summary_quota_retrieve` — GET /api/projects/{project_id}/subscriptions/summary_quota/
- `surveys_list` — GET /api/projects/{project_id}/surveys/
- `surveys_create` — POST /api/projects/{project_id}/surveys/
- `surveys_retrieve` — GET /api/projects/{project_id}/surveys/{id}/
- `surveys_update` — PUT /api/projects/{project_id}/surveys/{id}/
- `surveys_partial_update` — PATCH /api/projects/{project_id}/surveys/{id}/
- `surveys_destroy` — DELETE /api/projects/{project_id}/surveys/{id}/
- `surveys_activity_retrieve` — GET /api/projects/{project_id}/surveys/{id}/activity/
- `surveys_archived_response_uuids_retrieve` — Get list of archived response UUIDs for HogQL filtering.

Returns list of UUIDs that the frontend can use to filter out archived responses
in HogQL queries.
- `surveys_duplicate_to_projects_create` — Duplicate a survey to multiple projects in a single transaction.

Accepts a list of target team IDs and creates a copy of the survey in each project.
Uses an all-or-nothing approach - if any duplication fails, all changes are rolled back.
- `surveys_generate_translations_create` — POST /api/projects/{project_id}/surveys/{id}/generate_translations/
- `surveys_responses_archive_create` — Archive a single survey response.
- `surveys_responses_unarchive_create` — Unarchive a single survey response.
- `surveys_stats_retrieve` — Get survey response statistics for a specific survey.

Args:
    date_from: Optional ISO timestamp for start date (e.g. 2024-01-01T00:00:00Z)
    date_to: Optional ISO timestamp for end date (e.g. 2024-01-31T23:59:59Z)
    exclude_archived: Optional boolean to exclude archived responses (default: false, includes archived)

Returns:
    Survey statistics including event counts, unique respondents, and conversion rates
- `surveys_summarize_responses_create` — POST /api/projects/{project_id}/surveys/{id}/summarize_responses/
- `surveys_summary_headline_create` — POST /api/projects/{project_id}/surveys/{id}/summary_headline/
- `surveys_all_activity_retrieve` — GET /api/projects/{project_id}/surveys/activity/
- `surveys_question_labels` — Return a slim list of question labels for the team's surveys. Used by the frontend to resolve `$survey_response_<question_id>` property keys into human-readable question text without loading the full survey payload.
- `surveys_responses_count_retrieve` — Get response counts for all surveys.

Args:
    exclude_archived: Optional boolean to exclude archived responses (default: false, includes archived)
    survey_ids: Optional comma-separated list of survey IDs to filter by

Returns:
    Dictionary mapping survey IDs to response counts
- `surveys_global_stats_retrieve` — Get aggregated response statistics across all surveys.

Args:
    date_from: Optional ISO timestamp for start date (e.g. 2024-01-01T00:00:00Z)
    date_to: Optional ISO timestamp for end date (e.g. 2024-01-31T23:59:59Z)

Returns:
    Aggregated statistics across all surveys including total counts and rates
- `task_automations_list` — GET /api/projects/{project_id}/task_automations/
- `task_automations_create` — POST /api/projects/{project_id}/task_automations/
- `task_automations_retrieve` — GET /api/projects/{project_id}/task_automations/{id}/
- `task_automations_update` — PUT /api/projects/{project_id}/task_automations/{id}/
- `task_automations_partial_update` — PATCH /api/projects/{project_id}/task_automations/{id}/
- `task_automations_destroy` — DELETE /api/projects/{project_id}/task_automations/{id}/
- `task_automations_run_create` — POST /api/projects/{project_id}/task_automations/{id}/run/
- `tasks_list` — List tasks
- `tasks_create` — API for managing tasks within a project. Tasks represent units of work to be performed by an agent.
- `tasks_retrieve` — API for managing tasks within a project. Tasks represent units of work to be performed by an agent.
- `tasks_update` — API for managing tasks within a project. Tasks represent units of work to be performed by an agent.
- `tasks_partial_update` — API for managing tasks within a project. Tasks represent units of work to be performed by an agent.
- `tasks_destroy` — API for managing tasks within a project. Tasks represent units of work to be performed by an agent.
- `tasks_presence_create` — Beacon presence for a device watching this task
- `tasks_presence_destroy` — Beacon presence for a device watching this task
- `tasks_run_create` — Run task
- `tasks_staged_artifacts_finalize_upload_create` — Finalize staged direct uploads for task attachments
- `tasks_staged_artifacts_prepare_upload_create` — Prepare staged direct uploads for task attachments
- `tasks_runs_list` — List task runs
- `tasks_runs_create` — Create task run
- `tasks_runs_retrieve` — API for managing task runs. Each run represents an execution of a task.
- `tasks_runs_partial_update` — Update task run
- `tasks_runs_append_log_create` — Append log entries
- `tasks_runs_artifacts_create` — Upload artifacts for a task run
- `tasks_runs_artifacts_download_create` — Download an artifact through the backend
- `tasks_runs_artifacts_finalize_upload_create` — Finalize direct uploads for task run artifacts
- `tasks_runs_artifacts_prepare_upload_create` — Prepare direct uploads for task run artifacts
- `tasks_runs_artifacts_presign_create` — Generate presigned URL for an artifact
- `tasks_runs_command_create` — Send command to task run
- `tasks_runs_connection_token_retrieve` — Get sandbox connection token
- `tasks_runs_logs_retrieve` — Get task run logs
- `tasks_runs_relay_message_create` — Relay run message to Slack
- `tasks_runs_resume_in_cloud_create` — Resume task run in cloud
- `tasks_runs_session_logs_retrieve` — Get filtered task run session logs
- `tasks_runs_set_output_partial_update` — Set run output
- `tasks_runs_start_create` — Start task run
- `tasks_runs_stream_retrieve` — API for managing task runs. Each run represents an execution of a task.
- `tasks_repositories_retrieve` — List distinct task repositories
- `tasks_repository_readiness_retrieve` — Get repository readiness
- `tasks_slack_thread_context_retrieve` — Resolve a Slack thread to its task, runs, and Temporal workflows
- `tasks_summaries_create` — Fetch task summaries by ID
- `uploaded_media_create` — 
    When object storage is available this API allows upload of media which can be used, for example, in text cards on dashboards.

    Uploaded media must have a content type beginning with 'image/' and be less than 4MB.
    
- `visual_review_repos_list` — List all projects for the team.
- `visual_review_repos_create` — Create a new repo.
- `visual_review_repos_retrieve` — Get a repo by ID.
- `visual_review_repos_partial_update` — Update a repo's settings.
- `visual_review_repos_baselines_retrieve` — Snapshots overview for a repo: every identifier with a current baseline (latest non-superseded master/main run per run_type), plus tolerate counts, active quarantine state, and a 30-day stability sparkline. Capped at 5000 entries — sets `truncated` and returns the most recently active when exceeded. Filtering / faceting / search are all done client-side; this endpoint takes no filter query params.
- `visual_review_repos_quarantine_list` — List quarantined identifiers. Without filter: active only. With identifier: full history.
- `visual_review_repos_quarantine_create` — Quarantine a snapshot identifier for a specific run type.
- `visual_review_repos_quarantine_expire_create` — Expire all active quarantine entries for an identifier.
- `visual_review_repos_thumbnails_retrieve` — Serve a snapshot thumbnail by identifier. Returns WebP with ETag caching.
- `visual_review_repos_runs_list` — List runs in this repo, optionally filtered by review state.
- `visual_review_repos_runs_counts_retrieve` — Review state counts for runs in this repo.
- `visual_review_repos_snapshots_list` — Deduped baseline timeline for a snapshot identity. Newest first.
- `visual_review_runs_list` — List runs for the team, optionally filtered by review state, PR number, commit SHA, or branch.
- `visual_review_runs_create` — Create a new run from a CI manifest.
- `visual_review_runs_retrieve` — Get run status and summary.
- `visual_review_runs_add_snapshots_create` — Add a batch of snapshots to a pending run (shard-based flow).
- `visual_review_runs_approve_create` — Approve visual changes for snapshots in this run.

With approve_all=true, approves all changed+new snapshots and returns
signed baseline YAML. With specific snapshots, approves only those.
- `visual_review_runs_auto_approve_create` — CLI auto-approve: approve all and return baseline YAML for local write.
- `visual_review_runs_complete_create` — Complete a run: detect removals, verify uploads, trigger diff processing.
- `visual_review_runs_recompute_create` — Re-evaluate quarantine and counts, update commit status, and optionally rerun the CI job.
- `visual_review_runs_snapshot_history_list` — Recent change history for a snapshot identifier across runs.
- `visual_review_runs_snapshots_list` — Get all snapshots for a run with diff results.
- `visual_review_runs_tolerate_create` — Mark a changed snapshot as a known tolerated alternate.
- `visual_review_runs_tolerated_hashes_list` — List known tolerated hashes for a snapshot identifier.
- `visual_review_runs_counts_retrieve` — Review state counts for the runs list.
- `warehouse_dag_list` — Return this team's DAG as a set of edges and nodes
- `warehouse_model_paths_list` — GET /api/projects/{project_id}/warehouse_model_paths/
- `warehouse_model_paths_retrieve` — GET /api/projects/{project_id}/warehouse_model_paths/{id}/
- `warehouse_saved_queries_list` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_saved_queries_create` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_saved_queries_retrieve` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_saved_queries_update` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_saved_queries_partial_update` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_saved_queries_destroy` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_saved_queries_activity_retrieve` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_saved_queries_ancestors_create` — Return the ancestors of this saved query.

By default, we return the immediate parents. The `level` parameter can be used to
look further back into the ancestor tree. If `level` overshoots (i.e. points to only
ancestors beyond the root), we return an empty list.
- `warehouse_saved_queries_cancel_create` — Cancel a running saved query workflow.
- `warehouse_saved_queries_dependencies_retrieve` — Return the count of immediate upstream and downstream dependencies for this saved query.
- `warehouse_saved_queries_descendants_create` — Return the descendants of this saved query.

By default, we return the immediate children. The `level` parameter can be used to
look further ahead into the descendants tree. If `level` overshoots (i.e. points to only
descendants further than a leaf), we return an empty list.
- `warehouse_saved_queries_materialize_create` — Enable materialization for this saved query with a 24-hour sync frequency.
- `warehouse_saved_queries_revert_materialization_create` — Undo materialization, revert back to the original view.
(i.e. delete the materialized table and the schedule)
- `warehouse_saved_queries_run_create` — Run this saved query.
- `warehouse_saved_queries_run_history_retrieve` — Return the recent run history (up to 5 most recent) for this materialized view.
- `warehouse_saved_queries_resume_schedules_create` — Resume paused materialization schedules for multiple matviews.

Accepts a list of view IDs in the request body: {"view_ids": ["id1", "id2", ...]}
This endpoint is idempotent - calling it on already running or non-existent schedules is safe.
- `warehouse_saved_query_folders_list` — GET /api/projects/{project_id}/warehouse_saved_query_folders/
- `warehouse_saved_query_folders_create` — POST /api/projects/{project_id}/warehouse_saved_query_folders/
- `warehouse_saved_query_folders_retrieve` — GET /api/projects/{project_id}/warehouse_saved_query_folders/{id}/
- `warehouse_saved_query_folders_partial_update` — PATCH /api/projects/{project_id}/warehouse_saved_query_folders/{id}/
- `warehouse_saved_query_folders_destroy` — DELETE /api/projects/{project_id}/warehouse_saved_query_folders/{id}/
- `warehouse_tables_list` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_tables_create` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_tables_retrieve` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_tables_update` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_tables_partial_update` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_tables_destroy` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_tables_refresh_schema_create` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_tables_update_schema_create` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_tables_file_create` — Create, Read, Update and Delete Warehouse Tables.
- `warehouse_view_link_list` — Create, Read, Update and Delete View Columns.
- `warehouse_view_link_create` — Create, Read, Update and Delete View Columns.
- `warehouse_view_link_retrieve` — Create, Read, Update and Delete View Columns.
- `warehouse_view_link_update` — Create, Read, Update and Delete View Columns.
- `warehouse_view_link_partial_update` — Create, Read, Update and Delete View Columns.
- `warehouse_view_link_destroy` — Create, Read, Update and Delete View Columns.
- `warehouse_view_link_validate_create` — Create, Read, Update and Delete View Columns.
- `warehouse_view_links_list` — Create, Read, Update and Delete View Columns.
- `warehouse_view_links_create` — Create, Read, Update and Delete View Columns.
- `warehouse_view_links_retrieve` — Create, Read, Update and Delete View Columns.
- `warehouse_view_links_update` — Create, Read, Update and Delete View Columns.
- `warehouse_view_links_partial_update` — Create, Read, Update and Delete View Columns.
- `warehouse_view_links_destroy` — Create, Read, Update and Delete View Columns.
- `warehouse_view_links_validate_create` — Create, Read, Update and Delete View Columns.
- `web_experiments_list` — GET /api/projects/{project_id}/web_experiments/
- `web_experiments_create` — POST /api/projects/{project_id}/web_experiments/
- `web_experiments_retrieve` — GET /api/projects/{project_id}/web_experiments/{id}/
- `web_experiments_update` — PUT /api/projects/{project_id}/web_experiments/{id}/
- `web_experiments_partial_update` — PATCH /api/projects/{project_id}/web_experiments/{id}/
- `web_experiments_destroy` — DELETE /api/projects/{project_id}/web_experiments/{id}/
- `wizard_sessions_list` — List wizard sessions for the project, ordered by started_at desc. This should only be called by the PostHog Wizard. Optional filters: ?workflow_id=<id> and ?skill_id=<id>.
- `wizard_sessions_create` — Upsert a wizard session. The `session_id` key is the idempotency anchor — reposting the same `session_id` replaces the existing row. Returns 201 on create, 200 on update.
- `wizard_sessions_retrieve` — Retrieve a single wizard session by its session_id.
- `wizard_sessions_stream_retrieve` — Server-Sent Events stream of wizard session updates for a (workflow_id, skill_id) pair. On connect, the current latest session (if any) is emitted as the first event; subsequent upserts are streamed in real time. The server closes the connection after 1800 seconds with an `event: end` line so the client (EventSource) can reconnect.

**SDK consumers**: do not call the generated fetch wrapper for this path — it will buffer the entire infinite stream. Use the URL builder (`getWizardSessionsStreamRetrieveUrl`) with the browser's `EventSource` API instead.
- `public_hog_function_templates_list` — GET /api/public_hog_function_templates/
- `user_home_settings_retrieve` — Get the authenticated user's pinned sidebar tabs and configured homepage for the current team. Pass `@me` as the UUID.
- `user_home_settings_partial_update` — Update the authenticated user's pinned sidebar tabs and/or homepage for the current team. Pass `@me` as the UUID. Send `tabs` to replace the pinned tab list, `homepage` to set the home destination (any PostHog URL — dashboard, insight, search results, scene). Either field may be omitted to leave it unchanged; sending `homepage: null` or `{}` clears the homepage.
- `users_list` — GET /api/users/
- `users_signal_autonomy_retrieve` — Per-user signal autonomy config (singleton keyed by user).

GET    /api/users/<id>/signal_autonomy/ → current config (or 404)
POST   /api/users/<id>/signal_autonomy/ → create or update
DELETE /api/users/<id>/signal_autonomy/ → remove (opt out)
- `users_signal_autonomy_create` — Per-user signal autonomy config (singleton keyed by user).

GET    /api/users/<id>/signal_autonomy/ → current config (or 404)
POST   /api/users/<id>/signal_autonomy/ → create or update
DELETE /api/users/<id>/signal_autonomy/ → remove (opt out)
- `users_signal_autonomy_destroy` — Per-user signal autonomy config (singleton keyed by user).

GET    /api/users/<id>/signal_autonomy/ → current config (or 404)
POST   /api/users/<id>/signal_autonomy/ → create or update
DELETE /api/users/<id>/signal_autonomy/ → remove (opt out)
- `users_retrieve` — Retrieve a user's profile and settings. Pass `@me` as the UUID to fetch the authenticated user; non-staff callers may only access their own account.
- `users_update` — Replace the authenticated user's profile and settings. Pass `@me` as the UUID to update the authenticated user. Prefer the PATCH endpoint for partial updates — PUT requires every writable field to be provided.
- `users_partial_update` — Update one or more of the authenticated user's profile fields or settings.
- `users_destroy` — DELETE /api/users/{uuid}/
- `users_credentials_review_complete_create` — Mark the user as having reviewed their existing credentials. Idempotent. Flips `requires_credential_review` to False so the post-login interstitial isn't shown again. Does not modify any credentials; the user revokes individual Personal API Keys via the existing PAT endpoints from the same screen.
- `users_github_login_retrieve` — GET /api/users/{uuid}/github_login/
- `users_hedgehog_config_retrieve` — GET /api/users/{uuid}/hedgehog_config/
- `users_hedgehog_config_partial_update` — PATCH /api/users/{uuid}/hedgehog_config/
- `users_integrations_list` — List personal GitHub integrations
- `users_integrations_github_destroy` — Disconnect a personal GitHub integration
- `users_integrations_github_branches_retrieve` — List branches for a personal GitHub installation repository
- `users_integrations_github_repos_retrieve` — List repositories for a personal GitHub installation
- `users_integrations_github_repos_refresh_create` — Refresh repositories for a personal GitHub installation
- `users_integrations_github_start_create` — Start GitHub personal integration linking
- `users_onboarding_skip_create` — Mark the current user as having exited onboarding with a non-delegated reason.
Idempotent: the skip timestamp is only set on the first successful call.

Callers wanting to delegate setup to a teammate must use the dedicated
/organizations/{id}/invites/delegate/ endpoint, which atomically creates the
invite and sets reason="delegated". This endpoint rejects that reason so state
can't be faked without a real invite.
- `users_push_tokens_create` — Register a push notification token
- `users_push_tokens_unregister_create` — Unregister a push notification token
- `users_scene_personalisation_create` — POST /api/users/{uuid}/scene_personalisation/
- `users_start_2fa_setup_retrieve` — GET /api/users/{uuid}/start_2fa_setup/
- `users_two_factor_backup_codes_create` — Generate new backup codes, invalidating any existing ones
- `users_two_factor_disable_create` — Disable 2FA and remove all related devices
- `users_two_factor_start_setup_retrieve` — GET /api/users/{uuid}/two_factor_start_setup/
- `users_two_factor_status_retrieve` — Get current 2FA status including backup codes if enabled
- `users_two_factor_validate_create` — POST /api/users/{uuid}/two_factor_validate/
- `users_validate_2fa_create` — POST /api/users/{uuid}/validate_2fa/
- `users_cancel_email_change_request_partial_update` — PATCH /api/users/cancel_email_change_request/
- `users_request_email_verification_create` — POST /api/users/request_email_verification/
- `users_verify_email_create` — POST /api/users/verify_email/

## Setup

```bash
npm install
npm run build
# Register in ~/.claude.json or project .claude.json (see below)
```

## .claude.json registration

```json
{
  "mcpServers": {
    "posthog-mcp": {
      "command": "node",
      "args": [
        "dist/index.js"
      ],
      "env": {
        "API_KEY": "<your-api-key>"
      }
    }
  }
}
```

## Auth

Set `API_KEY` (env var for stdio, `wrangler secret` for http) to your upstream API token.

## Re-generate

```bash
node ~/.claude/plugins/heymegabyte-claude-skills/bin/forge-skill-from-openapi.mjs \
  <spec-url> <output-dir> --name posthog-mcp --target mcp-server --transport stdio
```
