import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useLayoutEffect, useState } from "react";
import { useTheme } from "@react-navigation/native";
import Accordion from "react-native-collapsible/Accordion";
import Icon from "@/components/common/Icon";
import { useNavigation } from "expo-router";
import ContainerView from "@/components/common/ContainerView";
import { SIZES } from "@/styles/sizes";

interface Section {
  title: string;
  content: string;
}

const SECTIONS: Section[] = [
  {
    title: "What is Lorem Ipsum?",
    content:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s",
  },
  {
    title: "Where does it come from?",
    content:
      "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.",
  },
  {
    title: "Why do we use it?",
    content:
      "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.",
  },
  {
    title: "Why do we use it?",
    content:
      "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.",
  },
];

const QuestionsPage = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Q&A" });
  }, []);

  const [activeSections, setActiveSections] = useState<number[]>([0]);

  const setSections = (sections: number[]) => {
    setActiveSections(sections.includes(undefined as unknown as number) ? [] : sections);
  };

  const AccordionHeader = (
    item: Section,
    _: number,
    isActive: boolean
  ) => {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 15,
        }}
      >
        <Text
          style={{
            fontWeight: "500",
            fontSize: 14,
            color: colors.text,
            flex: 1,
          }}
        >
          {item.title}
        </Text>
        {isActive ? (
          <Icon name="chevron-up" size={20} color={colors.text} />
        ) : (
          <Icon name="chevron-down" size={20} color={colors.text} />
        )}
      </View>
    );
  };

  const AccordionBody = (
    item: Section,
    _: number,
    isActive: boolean
  ) => {
    return (
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingVertical: 10,
          paddingHorizontal: 15,
        }}
      >
        <Text
          style={{
            color: colors.text,
            lineHeight: 20,
            fontSize: SIZES.fontMD,

            fontWeight: "400",
          }}
        >
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <ContainerView>
      <Accordion
        sections={SECTIONS}
        duration={300}
        sectionContainerStyle={[
          {
            // borderWidth: 1,
            // borderColor: theme.dark ? COLORS.white : colors.borderColor,
            marginBottom: 15,
            //paddingHorizontal: 20,
            borderRadius: 10,
            backgroundColor: colors.card,
          },
        ]}
        activeSections={activeSections}
        onChange={setSections}
        touchableComponent={TouchableOpacity}
        renderHeader={AccordionHeader}
        renderContent={AccordionBody}
      />
    </ContainerView>
  );
};

export default QuestionsPage;

const styles = StyleSheet.create({});
