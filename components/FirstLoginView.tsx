import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const getTemplates = (t: any) => [
  {
    id: "construction",
    name: t("templates.construction"),
    icon: require("../assets/images/construction.png"),
  },
  {
    id: "barber",
    name: t("templates.barber"),
    icon: require("../assets/images/barber.png"),
  },
  {
    id: "garden",
    name: t("templates.garden"),
    icon: require("../assets/images/garden.png"),
  },
  {
    id: "marketing",
    name: t("templates.marketing"),
    icon: require("../assets/images/marketing.png"),
  },
  {
    id: "mechanic",
    name: t("templates.mechanic"),
    icon: require("../assets/images/mechanic.png"),
  },
  {
    id: "events",
    name: t("templates.events"),
    icon: require("../assets/images/events.png"),
  },
];

const AnimatedText = ({
  text,
  style,
  show,
}: {
  text: string;
  style?: any;
  show: boolean;
}) => {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (show) {
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
        mass: 0.5,
      });
      opacity.value = withTiming(1, { duration: 400 });
    }
  }, [show, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.Text style={[style, animatedStyle]}>{text}</Animated.Text>;
};

const TemplateCard = ({
  template,
  index,
  isSelected,
  onSelect,
}: {
  template: any;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    scale.value = withDelay(
      index * 100,
      withSpring(1, {
        damping: 15,
        stiffness: 250,
        mass: 0.6,
      })
    );
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(
      index * 100,
      withSpring(0, {
        damping: 15,
        stiffness: 250,
        mass: 0.6,
      })
    );
  }, [index, opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={{
          backgroundColor: "white",
          borderRadius: 20,
          margin: 12,
          width: 140,
          height: 160,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
          borderWidth: isSelected ? 3 : 0,
          borderColor: "#007AFF",
        }}
        onPress={onSelect}
      >
        <Image
          source={template.icon}
          style={{ width: 80, height: 80, marginBottom: 16 }}
        />
        <Text
          style={{
            fontSize: 14,
            fontWeight: isSelected ? "600" : "400",
            textAlign: "center",
            color: isSelected ? "#007AFF" : "#000",
          }}
        >
          {template.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function FirstLoginView() {
  const { t } = useTranslation();
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );

  const templates = getTemplates(t);

  useEffect(() => {
    const titleTimer = setTimeout(() => setShowTitle(true), 100);
    const subtitleTimer = setTimeout(() => setShowSubtitle(true), 700);
    const templatesTimer = setTimeout(() => setShowTemplates(true), 1500);

    return () => {
      clearTimeout(titleTimer);
      clearTimeout(subtitleTimer);
      clearTimeout(templatesTimer);
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f5f5f5",
        justifyContent: "flex-start",
        alignItems: "center",
        paddingHorizontal: 10,
      }}
    >
      <View
        style={{
          marginTop: 20,
          alignItems: "center",
          marginBottom: 20,
          width: "100%",
        }}
      >
        <AnimatedText
          text={t("welcome.title")}
          show={showTitle}
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#222",
            marginBottom: 10,
            minHeight: 38,
            textAlign: "center",
            alignSelf: "center",
            width: "100%",
            justifyContent: "center",
          }}
        />
        <AnimatedText
          text={t("welcome.subtitle")}
          show={showSubtitle}
          style={{
            fontSize: 18,
            color: "#555",
            textAlign: "center",
            maxWidth: 320,
            minHeight: 48,
            alignSelf: "center",
            width: "100%",
            justifyContent: "center",
          }}
        />
      </View>
      {showTemplates && (
        <ScrollView
          contentContainerStyle={{ alignItems: "center", paddingBottom: 100 }}
        >
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {templates.map((tpl, idx) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                index={idx}
                isSelected={selectedTemplateId === tpl.id}
                onSelect={() => setSelectedTemplateId(tpl.id)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {selectedTemplateId && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            backgroundColor: "#f5f5f5",
            borderTopWidth: 1,
            borderTopColor: "#e0e0e0",
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: "#007AFF",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => {
              router.push({
                pathname: "/company-info",
                params: { sector: selectedTemplateId },
              });
            }}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              {t("common.continue")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
