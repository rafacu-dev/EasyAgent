import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Colors } from "@/app/utils/colors";

const getTemplates = (t: any) => [
  {
    id: "construction",
    name: t("templates.construction"),
    icon: require("@/assets/images/categories/construction.png"),
  },
  {
    id: "barber",
    name: t("templates.barber"),
    icon: require("@/assets/images/categories/barber.png"),
  },
  {
    id: "garden",
    name: t("templates.garden"),
    icon: require("@/assets/images/categories/garden.png"),
  },
  {
    id: "marketing",
    name: t("templates.marketing"),
    icon: require("@/assets/images/categories/marketing.png"),
  },
  {
    id: "mechanic",
    name: t("templates.mechanic"),
    icon: require("@/assets/images/categories/mechanic.png"),
  },
  {
    id: "events",
    name: t("templates.events"),
    icon: require("@/assets/images/categories/events.png"),
  },
  {
    id: "cleaner",
    name: t("templates.cleaner"),
    icon: require("@/assets/images/categories/cleaner.png"),
  },
  {
    id: "plumber",
    name: t("templates.plumber"),
    icon: require("@/assets/images/categories/plumber.png"),
  },
  {
    id: "air_conditioning",
    name: t("templates.air_conditioning"),
    icon: require("@/assets/images/categories/air_conditioning.png"),
  },
  {
    id: "electricity",
    name: t("templates.electricity"),
    icon: require("@/assets/images/categories/electricity.png"),
  },
  {
    id: "pest_control",
    name: t("templates.pest_control"),
    icon: require("@/assets/images/categories/pest_control.png"),
  },
  {
    id: "other",
    name: t("templates.other"),
    icon: require("@/assets/images/categories/other.png"),
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
          backgroundColor: Colors.cardBackground,
          borderRadius: 20,
          margin: 8,
          width: 105,
          height: 130,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: Colors.shadow,
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
          borderWidth: isSelected ? 3 : 0,
          borderColor: Colors.primary,
        }}
        onPress={onSelect}
      >
        <Image
          source={template.icon}
          style={{ width: 60, height: 60, marginBottom: 12 }}
        />
        <Text
          style={{
            fontSize: 12,
            fontWeight: isSelected ? "600" : "400",
            textAlign: "center",
            color: isSelected ? Colors.primary : Colors.textPrimary,
            paddingHorizontal: 4,
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
  const [customSector, setCustomSector] = useState("");

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
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
            color: Colors.textPrimary,
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
            color: Colors.textSecondary,
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
          contentContainerStyle={{ alignItems: "center", paddingBottom: selectedTemplateId === "other" ? 250 : 100 }}
          keyboardShouldPersistTaps="handled"
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
            backgroundColor: Colors.background,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
          }}
        >
          {selectedTemplateId === "other" && (
            <View
              style={{
                backgroundColor: Colors.cardBackground,
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 18,
                marginBottom: 16,
                shadowColor: Colors.shadow,
                shadowOpacity: 0.1,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: Colors.primary,
                  marginBottom: 8,
                  letterSpacing: 0.5,
                }}
              >
                {t("firstLogin.sector")}
              </Text>
              <TextInput
                style={{
                  fontSize: 16,
                  color: Colors.textPrimary,
                  padding: 0,
                  fontWeight: "500",
                }}
                placeholder={t("firstLogin.sectorPlaceholder")}
                placeholderTextColor={Colors.textSecondary + "80"}
                value={customSector}
                onChangeText={setCustomSector}
                autoFocus
              />
            </View>
          )}
          <TouchableOpacity
            style={{
              backgroundColor: Colors.primary,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              opacity: selectedTemplateId === "other" && !customSector.trim() ? 0.5 : 1,
            }}
            onPress={() => {
              if (selectedTemplateId === "other" && !customSector.trim()) {
                return;
              }
              router.push({
                pathname: "/intro/company-info",
                params: { 
                  sector: selectedTemplateId === "other" ? customSector.trim() : selectedTemplateId 
                },
              });
            }}
            disabled={selectedTemplateId === "other" && !customSector.trim()}
          >
            <Text
              style={{
                color: Colors.textWhite,
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              {t("common.continue")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      </View>
    </KeyboardAvoidingView>
  );
}
