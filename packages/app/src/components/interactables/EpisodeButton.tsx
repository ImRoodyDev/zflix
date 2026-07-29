// External imports
import clsx from "clsx";
import React, { memo, useCallback, useMemo } from "react";
import { Image, Text, View } from "react-native";
import { CustomButton } from "react-native-cross-elements";
import Animated, { ZoomIn, ZoomOut } from "react-native-reanimated";
import { InView } from "@imroodydev/rn-intersection-observer";

// Internal imports
import { Colors, Icons } from "../../constants";
import { useResponsiveSize } from "../../contexts/ResponsiveContext";
import { TvEpisode } from "../../types/Medias";
import { getApiUrl, getAuthenticatedImageSource } from "../../utils/fetcher";
import { formatMinutes } from "../../utils/standard";

type Props = {
  episode: TvEpisode;
  onPress?: (episode: TvEpisode) => void;
  runtime?: number;
};

function EpisodeButton({ episode, onPress, runtime }: Props) {
  const sizes = useResponsiveSize();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  // Handle mouse events
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handlePress = useCallback(() => {
    if (onPress) onPress(episode);
  }, [onPress, episode]);

  const image = useMemo(() => {
    return (
      <Image
        source={
          episode.backdrop
            ? getAuthenticatedImageSource(getApiUrl(episode.backdrop))
            : undefined
        }
        className={"app-episode-img"}
        resizeMode={"cover"}
        style={{ width: "auto", height: "100%" }}
      />
    );
  }, [episode.backdrop]);

  return (
    <InView onChange={(inView) => setIsVisible(inView)} triggerOnce={true}>
      <CustomButton
        //..
        className={clsx(
          "app-episode-item",
          isHovered && "app-episode-item-hover",
        )}
        onPress={handlePress}
        enableRipple
        rippleColor={Colors.zinc[800]}
        backgroundColor={"transparent"}
        selectedBackgroundColor={Colors.zinc[800]}
        pressedBackgroundColor={Colors.zinc[900]}
        pressedScale={1.04}
        onHoverIn={handleMouseEnter}
        onHoverOut={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        {() => (
          <>
            <View className={"app-episode-img-ptn"}>
              {isVisible && image}
              <View
                className={"app-episode-img-overlay"}
                style={isHovered && { backgroundColor: "#0000005f" }}
              >
                {isHovered && (
                  <Animated.View
                    entering={ZoomIn}
                    exiting={ZoomOut}
                    className={"app-episode-round-play"}
                  >
                    <Icons.play size={sizes.span1b} color={"white"} />
                  </Animated.View>
                )}

                {
                  // Watch time slider
                  runtime && runtime > 0 ? (
                    <View className={"app-episode-dt-slider"}>
                      <View
                        className={"app-episode-dt-slider-inner"}
                        style={{
                          width: `${(runtime / episode.minutes) * 100}%`,
                        }}
                      />
                    </View>
                  ) : (
                    <></>
                  )
                }
              </View>
            </View>
            <View className={"app-episode-infos"}>
              <View className={"app-episode-hd"}>
                <View className={"app-episode-round-badge"}>
                  <Text className={"app-episode-badge-number"}>
                    {episode.number}
                  </Text>
                </View>
                <Text className={"app-episode-title"}>{episode.title}</Text>
              </View>

              <View className={"app-episode-badges"}>
                <View className={"app-episode-badge"}>
                  <Text className={"preview-badge-txt episode-badge-txt"}>
                    {episode.aired ?? "##-##-####"}
                  </Text>
                </View>
                <View className={"app-episode-badge"}>
                  <Text className={"preview-badge-txt episode-badge-txt"}>
                    {formatMinutes(episode.minutes) ?? "0m"}
                  </Text>
                </View>
              </View>
              <Text
                className={"app-episode-summary"}
                numberOfLines={2}
                lineBreakMode={"tail"}
              >
                {episode.summary}
              </Text>
            </View>
          </>
        )}
      </CustomButton>
    </InView>
  );
}

export default memo(EpisodeButton);
