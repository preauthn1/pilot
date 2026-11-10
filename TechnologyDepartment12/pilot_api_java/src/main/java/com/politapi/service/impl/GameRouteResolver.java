package com.politapi.service.impl;

import com.politapi.entity.Channel;
import com.politapi.entity.ChannelGameConfig;

import java.util.Locale;

public final class GameRouteResolver {

    public ResolvedGameRoute resolve(Channel channel, String requestedGameCode, ChannelGameConfig mapping) {
        String normalizedRequest = normalize(requestedGameCode);
        String legacyGameCode = normalize(channel.getGameCode());
        boolean explicitRequest = !normalizedRequest.isEmpty();

        if (mapping != null) {
            String mappedCode = normalize(mapping.getGameCode());
            return new ResolvedGameRoute(
                    true,
                    mappedCode.isEmpty() ? (explicitRequest ? normalizedRequest : legacyGameCode) : mappedCode,
                    hasText(mapping.getDomain()) ? mapping.getDomain() : nullToEmpty(channel.getDomain()),
                    mapping.getServerConfigId(),
                    mapping.getGameSettingId(),
                    true
            );
        }

        if (explicitRequest && !normalizedRequest.equals(legacyGameCode)) {
            return ResolvedGameRoute.missing();
        }

        return new ResolvedGameRoute(
                true,
                legacyGameCode,
                nullToEmpty(channel.getDomain()),
                null,
                null,
                false
        );
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    public record ResolvedGameRoute(
            boolean exists,
            String gameCode,
            String domain,
            Long serverConfigId,
            Long gameSettingId,
            boolean usesMapping
    ) {
        static ResolvedGameRoute missing() {
            return new ResolvedGameRoute(false, "", "", null, null, false);
        }
    }
}
