drop extension if exists "pg_net";

revoke delete on table "public"."artist_genres" from "anon";

revoke insert on table "public"."artist_genres" from "anon";

revoke references on table "public"."artist_genres" from "anon";

revoke trigger on table "public"."artist_genres" from "anon";

revoke truncate on table "public"."artist_genres" from "anon";

revoke update on table "public"."artist_genres" from "anon";

revoke delete on table "public"."artist_genres" from "authenticated";

revoke references on table "public"."artist_genres" from "authenticated";

revoke trigger on table "public"."artist_genres" from "authenticated";

revoke truncate on table "public"."artist_genres" from "authenticated";

revoke update on table "public"."artist_genres" from "authenticated";

revoke delete on table "public"."artist_registrations" from "anon";

revoke insert on table "public"."artist_registrations" from "anon";

revoke references on table "public"."artist_registrations" from "anon";

revoke select on table "public"."artist_registrations" from "anon";

revoke trigger on table "public"."artist_registrations" from "anon";

revoke truncate on table "public"."artist_registrations" from "anon";

revoke update on table "public"."artist_registrations" from "anon";

revoke delete on table "public"."artist_registrations" from "authenticated";

revoke references on table "public"."artist_registrations" from "authenticated";

revoke trigger on table "public"."artist_registrations" from "authenticated";

revoke truncate on table "public"."artist_registrations" from "authenticated";

revoke update on table "public"."artist_registrations" from "authenticated";

revoke delete on table "public"."artists" from "anon";

revoke insert on table "public"."artists" from "anon";

revoke references on table "public"."artists" from "anon";

revoke trigger on table "public"."artists" from "anon";

revoke truncate on table "public"."artists" from "anon";

revoke update on table "public"."artists" from "anon";

revoke references on table "public"."artists" from "authenticated";

revoke trigger on table "public"."artists" from "authenticated";

revoke truncate on table "public"."artists" from "authenticated";

revoke delete on table "public"."cities" from "anon";

revoke insert on table "public"."cities" from "anon";

revoke references on table "public"."cities" from "anon";

revoke trigger on table "public"."cities" from "anon";

revoke truncate on table "public"."cities" from "anon";

revoke update on table "public"."cities" from "anon";

revoke references on table "public"."cities" from "authenticated";

revoke trigger on table "public"."cities" from "authenticated";

revoke truncate on table "public"."cities" from "authenticated";

revoke references on table "public"."column_customizations" from "anon";

revoke trigger on table "public"."column_customizations" from "anon";

revoke truncate on table "public"."column_customizations" from "anon";

revoke references on table "public"."column_customizations" from "authenticated";

revoke trigger on table "public"."column_customizations" from "authenticated";

revoke truncate on table "public"."column_customizations" from "authenticated";

revoke delete on table "public"."datagrid_configs" from "anon";

revoke insert on table "public"."datagrid_configs" from "anon";

revoke references on table "public"."datagrid_configs" from "anon";

revoke select on table "public"."datagrid_configs" from "anon";

revoke trigger on table "public"."datagrid_configs" from "anon";

revoke truncate on table "public"."datagrid_configs" from "anon";

revoke update on table "public"."datagrid_configs" from "anon";

revoke references on table "public"."datagrid_configs" from "authenticated";

revoke trigger on table "public"."datagrid_configs" from "authenticated";

revoke truncate on table "public"."datagrid_configs" from "authenticated";

revoke delete on table "public"."dev_notes" from "anon";

revoke insert on table "public"."dev_notes" from "anon";

revoke references on table "public"."dev_notes" from "anon";

revoke select on table "public"."dev_notes" from "anon";

revoke trigger on table "public"."dev_notes" from "anon";

revoke truncate on table "public"."dev_notes" from "anon";

revoke update on table "public"."dev_notes" from "anon";

revoke references on table "public"."dev_notes" from "authenticated";

revoke trigger on table "public"."dev_notes" from "authenticated";

revoke truncate on table "public"."dev_notes" from "authenticated";

revoke delete on table "public"."environments" from "anon";

revoke insert on table "public"."environments" from "anon";

revoke references on table "public"."environments" from "anon";

revoke trigger on table "public"."environments" from "anon";

revoke truncate on table "public"."environments" from "anon";

revoke update on table "public"."environments" from "anon";

revoke delete on table "public"."environments" from "authenticated";

revoke insert on table "public"."environments" from "authenticated";

revoke references on table "public"."environments" from "authenticated";

revoke trigger on table "public"."environments" from "authenticated";

revoke truncate on table "public"."environments" from "authenticated";

revoke update on table "public"."environments" from "authenticated";

revoke delete on table "public"."event_artists" from "anon";

revoke insert on table "public"."event_artists" from "anon";

revoke references on table "public"."event_artists" from "anon";

revoke trigger on table "public"."event_artists" from "anon";

revoke truncate on table "public"."event_artists" from "anon";

revoke update on table "public"."event_artists" from "anon";

revoke references on table "public"."event_artists" from "authenticated";

revoke trigger on table "public"."event_artists" from "authenticated";

revoke truncate on table "public"."event_artists" from "authenticated";

revoke delete on table "public"."event_images" from "anon";

revoke insert on table "public"."event_images" from "anon";

revoke references on table "public"."event_images" from "anon";

revoke trigger on table "public"."event_images" from "anon";

revoke truncate on table "public"."event_images" from "anon";

revoke update on table "public"."event_images" from "anon";

revoke delete on table "public"."event_images" from "authenticated";

revoke insert on table "public"."event_images" from "authenticated";

revoke references on table "public"."event_images" from "authenticated";

revoke trigger on table "public"."event_images" from "authenticated";

revoke truncate on table "public"."event_images" from "authenticated";

revoke update on table "public"."event_images" from "authenticated";

revoke delete on table "public"."event_views" from "anon";

revoke references on table "public"."event_views" from "anon";

revoke trigger on table "public"."event_views" from "anon";

revoke truncate on table "public"."event_views" from "anon";

revoke update on table "public"."event_views" from "anon";

revoke delete on table "public"."event_views" from "authenticated";

revoke references on table "public"."event_views" from "authenticated";

revoke trigger on table "public"."event_views" from "authenticated";

revoke truncate on table "public"."event_views" from "authenticated";

revoke update on table "public"."event_views" from "authenticated";

revoke delete on table "public"."events" from "anon";

revoke insert on table "public"."events" from "anon";

revoke references on table "public"."events" from "anon";

revoke trigger on table "public"."events" from "anon";

revoke truncate on table "public"."events" from "anon";

revoke update on table "public"."events" from "anon";

revoke references on table "public"."events" from "authenticated";

revoke trigger on table "public"."events" from "authenticated";

revoke truncate on table "public"."events" from "authenticated";

revoke delete on table "public"."exclusive_content_grants" from "anon";

revoke insert on table "public"."exclusive_content_grants" from "anon";

revoke references on table "public"."exclusive_content_grants" from "anon";

revoke select on table "public"."exclusive_content_grants" from "anon";

revoke trigger on table "public"."exclusive_content_grants" from "anon";

revoke truncate on table "public"."exclusive_content_grants" from "anon";

revoke update on table "public"."exclusive_content_grants" from "anon";

revoke references on table "public"."exclusive_content_grants" from "authenticated";

revoke trigger on table "public"."exclusive_content_grants" from "authenticated";

revoke truncate on table "public"."exclusive_content_grants" from "authenticated";

revoke delete on table "public"."feature_flags" from "anon";

revoke insert on table "public"."feature_flags" from "anon";

revoke references on table "public"."feature_flags" from "anon";

revoke trigger on table "public"."feature_flags" from "anon";

revoke truncate on table "public"."feature_flags" from "anon";

revoke update on table "public"."feature_flags" from "anon";

revoke delete on table "public"."feature_flags" from "authenticated";

revoke insert on table "public"."feature_flags" from "authenticated";

revoke references on table "public"."feature_flags" from "authenticated";

revoke trigger on table "public"."feature_flags" from "authenticated";

revoke truncate on table "public"."feature_flags" from "authenticated";

revoke update on table "public"."feature_flags" from "authenticated";

revoke delete on table "public"."genres" from "anon";

revoke insert on table "public"."genres" from "anon";

revoke references on table "public"."genres" from "anon";

revoke trigger on table "public"."genres" from "anon";

revoke truncate on table "public"."genres" from "anon";

revoke update on table "public"."genres" from "anon";

revoke delete on table "public"."genres" from "authenticated";

revoke insert on table "public"."genres" from "authenticated";

revoke references on table "public"."genres" from "authenticated";

revoke trigger on table "public"."genres" from "authenticated";

revoke truncate on table "public"."genres" from "authenticated";

revoke update on table "public"."genres" from "authenticated";

revoke delete on table "public"."guest_list_settings" from "anon";

revoke insert on table "public"."guest_list_settings" from "anon";

revoke references on table "public"."guest_list_settings" from "anon";

revoke select on table "public"."guest_list_settings" from "anon";

revoke trigger on table "public"."guest_list_settings" from "anon";

revoke truncate on table "public"."guest_list_settings" from "anon";

revoke update on table "public"."guest_list_settings" from "anon";

revoke delete on table "public"."guest_list_settings" from "authenticated";

revoke insert on table "public"."guest_list_settings" from "authenticated";

revoke references on table "public"."guest_list_settings" from "authenticated";

revoke select on table "public"."guest_list_settings" from "authenticated";

revoke trigger on table "public"."guest_list_settings" from "authenticated";

revoke truncate on table "public"."guest_list_settings" from "authenticated";

revoke update on table "public"."guest_list_settings" from "authenticated";

revoke delete on table "public"."guest_list_settings" from "service_role";

revoke insert on table "public"."guest_list_settings" from "service_role";

revoke references on table "public"."guest_list_settings" from "service_role";

revoke select on table "public"."guest_list_settings" from "service_role";

revoke trigger on table "public"."guest_list_settings" from "service_role";

revoke truncate on table "public"."guest_list_settings" from "service_role";

revoke update on table "public"."guest_list_settings" from "service_role";

revoke delete on table "public"."link_clicks" from "anon";

revoke insert on table "public"."link_clicks" from "anon";

revoke references on table "public"."link_clicks" from "anon";

revoke select on table "public"."link_clicks" from "anon";

revoke trigger on table "public"."link_clicks" from "anon";

revoke truncate on table "public"."link_clicks" from "anon";

revoke update on table "public"."link_clicks" from "anon";

revoke delete on table "public"."link_clicks" from "authenticated";

revoke insert on table "public"."link_clicks" from "authenticated";

revoke references on table "public"."link_clicks" from "authenticated";

revoke select on table "public"."link_clicks" from "authenticated";

revoke trigger on table "public"."link_clicks" from "authenticated";

revoke truncate on table "public"."link_clicks" from "authenticated";

revoke update on table "public"."link_clicks" from "authenticated";

revoke delete on table "public"."link_clicks" from "service_role";

revoke insert on table "public"."link_clicks" from "service_role";

revoke references on table "public"."link_clicks" from "service_role";

revoke select on table "public"."link_clicks" from "service_role";

revoke trigger on table "public"."link_clicks" from "service_role";

revoke truncate on table "public"."link_clicks" from "service_role";

revoke update on table "public"."link_clicks" from "service_role";

revoke delete on table "public"."order_items" from "anon";

revoke insert on table "public"."order_items" from "anon";

revoke references on table "public"."order_items" from "anon";

revoke select on table "public"."order_items" from "anon";

revoke trigger on table "public"."order_items" from "anon";

revoke truncate on table "public"."order_items" from "anon";

revoke update on table "public"."order_items" from "anon";

revoke references on table "public"."order_items" from "authenticated";

revoke trigger on table "public"."order_items" from "authenticated";

revoke truncate on table "public"."order_items" from "authenticated";

revoke delete on table "public"."orders" from "anon";

revoke insert on table "public"."orders" from "anon";

revoke references on table "public"."orders" from "anon";

revoke select on table "public"."orders" from "anon";

revoke trigger on table "public"."orders" from "anon";

revoke truncate on table "public"."orders" from "anon";

revoke update on table "public"."orders" from "anon";

revoke references on table "public"."orders" from "authenticated";

revoke trigger on table "public"."orders" from "authenticated";

revoke truncate on table "public"."orders" from "authenticated";

revoke delete on table "public"."organizations" from "anon";

revoke insert on table "public"."organizations" from "anon";

revoke references on table "public"."organizations" from "anon";

revoke trigger on table "public"."organizations" from "anon";

revoke truncate on table "public"."organizations" from "anon";

revoke update on table "public"."organizations" from "anon";

revoke delete on table "public"."organizations" from "authenticated";

revoke references on table "public"."organizations" from "authenticated";

revoke trigger on table "public"."organizations" from "authenticated";

revoke truncate on table "public"."organizations" from "authenticated";

revoke update on table "public"."organizations" from "authenticated";

revoke delete on table "public"."products" from "anon";

revoke insert on table "public"."products" from "anon";

revoke references on table "public"."products" from "anon";

revoke trigger on table "public"."products" from "anon";

revoke truncate on table "public"."products" from "anon";

revoke update on table "public"."products" from "anon";

revoke delete on table "public"."products" from "authenticated";

revoke insert on table "public"."products" from "authenticated";

revoke references on table "public"."products" from "authenticated";

revoke trigger on table "public"."products" from "authenticated";

revoke truncate on table "public"."products" from "authenticated";

revoke update on table "public"."products" from "authenticated";

revoke delete on table "public"."products" from "service_role";

revoke insert on table "public"."products" from "service_role";

revoke references on table "public"."products" from "service_role";

revoke select on table "public"."products" from "service_role";

revoke trigger on table "public"."products" from "service_role";

revoke truncate on table "public"."products" from "service_role";

revoke update on table "public"."products" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke delete on table "public"."promo_codes" from "anon";

revoke insert on table "public"."promo_codes" from "anon";

revoke references on table "public"."promo_codes" from "anon";

revoke trigger on table "public"."promo_codes" from "anon";

revoke truncate on table "public"."promo_codes" from "anon";

revoke update on table "public"."promo_codes" from "anon";

revoke references on table "public"."promo_codes" from "authenticated";

revoke trigger on table "public"."promo_codes" from "authenticated";

revoke truncate on table "public"."promo_codes" from "authenticated";

revoke delete on table "public"."queue_configurations" from "anon";

revoke insert on table "public"."queue_configurations" from "anon";

revoke references on table "public"."queue_configurations" from "anon";

revoke trigger on table "public"."queue_configurations" from "anon";

revoke truncate on table "public"."queue_configurations" from "anon";

revoke update on table "public"."queue_configurations" from "anon";

revoke delete on table "public"."queue_configurations" from "authenticated";

revoke insert on table "public"."queue_configurations" from "authenticated";

revoke references on table "public"."queue_configurations" from "authenticated";

revoke trigger on table "public"."queue_configurations" from "authenticated";

revoke truncate on table "public"."queue_configurations" from "authenticated";

revoke update on table "public"."queue_configurations" from "authenticated";

revoke delete on table "public"."report_configurations" from "anon";

revoke insert on table "public"."report_configurations" from "anon";

revoke references on table "public"."report_configurations" from "anon";

revoke select on table "public"."report_configurations" from "anon";

revoke trigger on table "public"."report_configurations" from "anon";

revoke truncate on table "public"."report_configurations" from "anon";

revoke update on table "public"."report_configurations" from "anon";

revoke delete on table "public"."report_configurations" from "authenticated";

revoke insert on table "public"."report_configurations" from "authenticated";

revoke references on table "public"."report_configurations" from "authenticated";

revoke select on table "public"."report_configurations" from "authenticated";

revoke trigger on table "public"."report_configurations" from "authenticated";

revoke truncate on table "public"."report_configurations" from "authenticated";

revoke update on table "public"."report_configurations" from "authenticated";

revoke delete on table "public"."report_configurations" from "service_role";

revoke insert on table "public"."report_configurations" from "service_role";

revoke references on table "public"."report_configurations" from "service_role";

revoke select on table "public"."report_configurations" from "service_role";

revoke trigger on table "public"."report_configurations" from "service_role";

revoke truncate on table "public"."report_configurations" from "service_role";

revoke update on table "public"."report_configurations" from "service_role";

revoke delete on table "public"."report_history" from "anon";

revoke insert on table "public"."report_history" from "anon";

revoke references on table "public"."report_history" from "anon";

revoke select on table "public"."report_history" from "anon";

revoke trigger on table "public"."report_history" from "anon";

revoke truncate on table "public"."report_history" from "anon";

revoke update on table "public"."report_history" from "anon";

revoke delete on table "public"."report_history" from "authenticated";

revoke insert on table "public"."report_history" from "authenticated";

revoke references on table "public"."report_history" from "authenticated";

revoke select on table "public"."report_history" from "authenticated";

revoke trigger on table "public"."report_history" from "authenticated";

revoke truncate on table "public"."report_history" from "authenticated";

revoke update on table "public"."report_history" from "authenticated";

revoke delete on table "public"."report_history" from "service_role";

revoke insert on table "public"."report_history" from "service_role";

revoke references on table "public"."report_history" from "service_role";

revoke select on table "public"."report_history" from "service_role";

revoke trigger on table "public"."report_history" from "service_role";

revoke truncate on table "public"."report_history" from "service_role";

revoke update on table "public"."report_history" from "service_role";

revoke delete on table "public"."report_recipients" from "anon";

revoke insert on table "public"."report_recipients" from "anon";

revoke references on table "public"."report_recipients" from "anon";

revoke select on table "public"."report_recipients" from "anon";

revoke trigger on table "public"."report_recipients" from "anon";

revoke truncate on table "public"."report_recipients" from "anon";

revoke update on table "public"."report_recipients" from "anon";

revoke delete on table "public"."report_recipients" from "authenticated";

revoke insert on table "public"."report_recipients" from "authenticated";

revoke references on table "public"."report_recipients" from "authenticated";

revoke select on table "public"."report_recipients" from "authenticated";

revoke trigger on table "public"."report_recipients" from "authenticated";

revoke truncate on table "public"."report_recipients" from "authenticated";

revoke update on table "public"."report_recipients" from "authenticated";

revoke delete on table "public"."report_recipients" from "service_role";

revoke insert on table "public"."report_recipients" from "service_role";

revoke references on table "public"."report_recipients" from "service_role";

revoke select on table "public"."report_recipients" from "service_role";

revoke trigger on table "public"."report_recipients" from "service_role";

revoke truncate on table "public"."report_recipients" from "service_role";

revoke update on table "public"."report_recipients" from "service_role";

revoke delete on table "public"."roles" from "anon";

revoke insert on table "public"."roles" from "anon";

revoke references on table "public"."roles" from "anon";

revoke trigger on table "public"."roles" from "anon";

revoke truncate on table "public"."roles" from "anon";

revoke update on table "public"."roles" from "anon";

revoke delete on table "public"."roles" from "authenticated";

revoke insert on table "public"."roles" from "authenticated";

revoke references on table "public"."roles" from "authenticated";

revoke trigger on table "public"."roles" from "authenticated";

revoke truncate on table "public"."roles" from "authenticated";

revoke update on table "public"."roles" from "authenticated";

revoke delete on table "public"."scavenger_claims" from "anon";

revoke insert on table "public"."scavenger_claims" from "anon";

revoke references on table "public"."scavenger_claims" from "anon";

revoke select on table "public"."scavenger_claims" from "anon";

revoke trigger on table "public"."scavenger_claims" from "anon";

revoke truncate on table "public"."scavenger_claims" from "anon";

revoke update on table "public"."scavenger_claims" from "anon";

revoke references on table "public"."scavenger_claims" from "authenticated";

revoke trigger on table "public"."scavenger_claims" from "authenticated";

revoke truncate on table "public"."scavenger_claims" from "authenticated";

revoke delete on table "public"."scavenger_locations" from "anon";

revoke insert on table "public"."scavenger_locations" from "anon";

revoke references on table "public"."scavenger_locations" from "anon";

revoke select on table "public"."scavenger_locations" from "anon";

revoke trigger on table "public"."scavenger_locations" from "anon";

revoke truncate on table "public"."scavenger_locations" from "anon";

revoke update on table "public"."scavenger_locations" from "anon";

revoke references on table "public"."scavenger_locations" from "authenticated";

revoke trigger on table "public"."scavenger_locations" from "authenticated";

revoke truncate on table "public"."scavenger_locations" from "authenticated";

revoke delete on table "public"."scavenger_tokens" from "anon";

revoke insert on table "public"."scavenger_tokens" from "anon";

revoke references on table "public"."scavenger_tokens" from "anon";

revoke select on table "public"."scavenger_tokens" from "anon";

revoke trigger on table "public"."scavenger_tokens" from "anon";

revoke truncate on table "public"."scavenger_tokens" from "anon";

revoke update on table "public"."scavenger_tokens" from "anon";

revoke references on table "public"."scavenger_tokens" from "authenticated";

revoke trigger on table "public"."scavenger_tokens" from "authenticated";

revoke truncate on table "public"."scavenger_tokens" from "authenticated";

revoke references on table "public"."table_metadata" from "anon";

revoke trigger on table "public"."table_metadata" from "anon";

revoke truncate on table "public"."table_metadata" from "anon";

revoke references on table "public"."table_metadata" from "authenticated";

revoke trigger on table "public"."table_metadata" from "authenticated";

revoke truncate on table "public"."table_metadata" from "authenticated";

revoke delete on table "public"."ticket_groups" from "anon";

revoke insert on table "public"."ticket_groups" from "anon";

revoke references on table "public"."ticket_groups" from "anon";

revoke select on table "public"."ticket_groups" from "anon";

revoke trigger on table "public"."ticket_groups" from "anon";

revoke truncate on table "public"."ticket_groups" from "anon";

revoke update on table "public"."ticket_groups" from "anon";

revoke delete on table "public"."ticket_groups" from "authenticated";

revoke insert on table "public"."ticket_groups" from "authenticated";

revoke references on table "public"."ticket_groups" from "authenticated";

revoke select on table "public"."ticket_groups" from "authenticated";

revoke trigger on table "public"."ticket_groups" from "authenticated";

revoke truncate on table "public"."ticket_groups" from "authenticated";

revoke update on table "public"."ticket_groups" from "authenticated";

revoke delete on table "public"."ticket_groups" from "service_role";

revoke insert on table "public"."ticket_groups" from "service_role";

revoke references on table "public"."ticket_groups" from "service_role";

revoke select on table "public"."ticket_groups" from "service_role";

revoke trigger on table "public"."ticket_groups" from "service_role";

revoke truncate on table "public"."ticket_groups" from "service_role";

revoke update on table "public"."ticket_groups" from "service_role";

revoke delete on table "public"."ticket_holds" from "anon";

revoke insert on table "public"."ticket_holds" from "anon";

revoke references on table "public"."ticket_holds" from "anon";

revoke select on table "public"."ticket_holds" from "anon";

revoke trigger on table "public"."ticket_holds" from "anon";

revoke truncate on table "public"."ticket_holds" from "anon";

revoke update on table "public"."ticket_holds" from "anon";

revoke references on table "public"."ticket_holds" from "authenticated";

revoke trigger on table "public"."ticket_holds" from "authenticated";

revoke truncate on table "public"."ticket_holds" from "authenticated";

revoke delete on table "public"."ticket_scan_events" from "anon";

revoke insert on table "public"."ticket_scan_events" from "anon";

revoke references on table "public"."ticket_scan_events" from "anon";

revoke select on table "public"."ticket_scan_events" from "anon";

revoke trigger on table "public"."ticket_scan_events" from "anon";

revoke truncate on table "public"."ticket_scan_events" from "anon";

revoke update on table "public"."ticket_scan_events" from "anon";

revoke delete on table "public"."ticket_scan_events" from "authenticated";

revoke insert on table "public"."ticket_scan_events" from "authenticated";

revoke references on table "public"."ticket_scan_events" from "authenticated";

revoke select on table "public"."ticket_scan_events" from "authenticated";

revoke trigger on table "public"."ticket_scan_events" from "authenticated";

revoke truncate on table "public"."ticket_scan_events" from "authenticated";

revoke update on table "public"."ticket_scan_events" from "authenticated";

revoke delete on table "public"."ticket_scan_events" from "service_role";

revoke insert on table "public"."ticket_scan_events" from "service_role";

revoke references on table "public"."ticket_scan_events" from "service_role";

revoke select on table "public"."ticket_scan_events" from "service_role";

revoke trigger on table "public"."ticket_scan_events" from "service_role";

revoke truncate on table "public"."ticket_scan_events" from "service_role";

revoke update on table "public"."ticket_scan_events" from "service_role";

revoke delete on table "public"."ticket_tiers" from "anon";

revoke insert on table "public"."ticket_tiers" from "anon";

revoke references on table "public"."ticket_tiers" from "anon";

revoke trigger on table "public"."ticket_tiers" from "anon";

revoke truncate on table "public"."ticket_tiers" from "anon";

revoke update on table "public"."ticket_tiers" from "anon";

revoke references on table "public"."ticket_tiers" from "authenticated";

revoke trigger on table "public"."ticket_tiers" from "authenticated";

revoke truncate on table "public"."ticket_tiers" from "authenticated";

revoke delete on table "public"."ticketing_fees" from "anon";

revoke insert on table "public"."ticketing_fees" from "anon";

revoke references on table "public"."ticketing_fees" from "anon";

revoke trigger on table "public"."ticketing_fees" from "anon";

revoke truncate on table "public"."ticketing_fees" from "anon";

revoke update on table "public"."ticketing_fees" from "anon";

revoke references on table "public"."ticketing_fees" from "authenticated";

revoke trigger on table "public"."ticketing_fees" from "authenticated";

revoke truncate on table "public"."ticketing_fees" from "authenticated";

revoke delete on table "public"."ticketing_sessions" from "anon";

revoke references on table "public"."ticketing_sessions" from "anon";

revoke trigger on table "public"."ticketing_sessions" from "anon";

revoke truncate on table "public"."ticketing_sessions" from "anon";

revoke delete on table "public"."ticketing_sessions" from "authenticated";

revoke references on table "public"."ticketing_sessions" from "authenticated";

revoke trigger on table "public"."ticketing_sessions" from "authenticated";

revoke truncate on table "public"."ticketing_sessions" from "authenticated";

revoke delete on table "public"."tickets" from "anon";

revoke insert on table "public"."tickets" from "anon";

revoke references on table "public"."tickets" from "anon";

revoke select on table "public"."tickets" from "anon";

revoke trigger on table "public"."tickets" from "anon";

revoke truncate on table "public"."tickets" from "anon";

revoke update on table "public"."tickets" from "anon";

revoke references on table "public"."tickets" from "authenticated";

revoke trigger on table "public"."tickets" from "authenticated";

revoke truncate on table "public"."tickets" from "authenticated";

revoke delete on table "public"."tracking_links" from "anon";

revoke insert on table "public"."tracking_links" from "anon";

revoke references on table "public"."tracking_links" from "anon";

revoke select on table "public"."tracking_links" from "anon";

revoke trigger on table "public"."tracking_links" from "anon";

revoke truncate on table "public"."tracking_links" from "anon";

revoke update on table "public"."tracking_links" from "anon";

revoke delete on table "public"."tracking_links" from "authenticated";

revoke insert on table "public"."tracking_links" from "authenticated";

revoke references on table "public"."tracking_links" from "authenticated";

revoke select on table "public"."tracking_links" from "authenticated";

revoke trigger on table "public"."tracking_links" from "authenticated";

revoke truncate on table "public"."tracking_links" from "authenticated";

revoke update on table "public"."tracking_links" from "authenticated";

revoke delete on table "public"."tracking_links" from "service_role";

revoke insert on table "public"."tracking_links" from "service_role";

revoke references on table "public"."tracking_links" from "service_role";

revoke select on table "public"."tracking_links" from "service_role";

revoke trigger on table "public"."tracking_links" from "service_role";

revoke truncate on table "public"."tracking_links" from "service_role";

revoke update on table "public"."tracking_links" from "service_role";

revoke delete on table "public"."user_event_interests" from "anon";

revoke insert on table "public"."user_event_interests" from "anon";

revoke references on table "public"."user_event_interests" from "anon";

revoke select on table "public"."user_event_interests" from "anon";

revoke trigger on table "public"."user_event_interests" from "anon";

revoke truncate on table "public"."user_event_interests" from "anon";

revoke update on table "public"."user_event_interests" from "anon";

revoke delete on table "public"."user_event_interests" from "authenticated";

revoke insert on table "public"."user_event_interests" from "authenticated";

revoke references on table "public"."user_event_interests" from "authenticated";

revoke select on table "public"."user_event_interests" from "authenticated";

revoke trigger on table "public"."user_event_interests" from "authenticated";

revoke truncate on table "public"."user_event_interests" from "authenticated";

revoke update on table "public"."user_event_interests" from "authenticated";

revoke delete on table "public"."user_event_interests" from "service_role";

revoke insert on table "public"."user_event_interests" from "service_role";

revoke references on table "public"."user_event_interests" from "service_role";

revoke select on table "public"."user_event_interests" from "service_role";

revoke trigger on table "public"."user_event_interests" from "service_role";

revoke truncate on table "public"."user_event_interests" from "service_role";

revoke update on table "public"."user_event_interests" from "service_role";

revoke delete on table "public"."user_roles" from "anon";

revoke insert on table "public"."user_roles" from "anon";

revoke references on table "public"."user_roles" from "anon";

revoke trigger on table "public"."user_roles" from "anon";

revoke truncate on table "public"."user_roles" from "anon";

revoke update on table "public"."user_roles" from "anon";

revoke references on table "public"."user_roles" from "authenticated";

revoke trigger on table "public"."user_roles" from "authenticated";

revoke truncate on table "public"."user_roles" from "authenticated";

revoke delete on table "public"."venues" from "anon";

revoke insert on table "public"."venues" from "anon";

revoke references on table "public"."venues" from "anon";

revoke trigger on table "public"."venues" from "anon";

revoke truncate on table "public"."venues" from "anon";

revoke update on table "public"."venues" from "anon";

revoke references on table "public"."venues" from "authenticated";

revoke trigger on table "public"."venues" from "authenticated";

revoke truncate on table "public"."venues" from "authenticated";

revoke delete on table "public"."webhook_events" from "anon";

revoke insert on table "public"."webhook_events" from "anon";

revoke references on table "public"."webhook_events" from "anon";

revoke select on table "public"."webhook_events" from "anon";

revoke trigger on table "public"."webhook_events" from "anon";

revoke truncate on table "public"."webhook_events" from "anon";

revoke update on table "public"."webhook_events" from "anon";

revoke references on table "public"."webhook_events" from "authenticated";

revoke trigger on table "public"."webhook_events" from "authenticated";

revoke truncate on table "public"."webhook_events" from "authenticated";

drop index if exists "public"."idx_events_venue_start_time";

drop policy "Admins and developers can delete artist images" on "storage"."objects";

drop policy "Admins and developers can update artist images" on "storage"."objects";

drop policy "Admins and developers can upload artist images" on "storage"."objects";

drop policy "Anyone can view artist images" on "storage"."objects";


