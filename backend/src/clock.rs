pub(crate) fn now() -> String {
    time::OffsetDateTime::now_utc()
        .format(time::macros::format_description!(
            "[day]-[month]-[year] [hour]:[minute]:[second]"
        ))
        .unwrap_or_default()
}
