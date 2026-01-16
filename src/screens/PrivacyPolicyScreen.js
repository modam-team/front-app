import AppHeader from "@components/common/AppHeader";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader
        title="개인정보처리방침"
        showBack
        onPressBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.date}>시행일: 2024.01.01</Text>

        <Section title="1. 수집하는 개인정보 항목">
          <Paragraph>
            모담은 서비스 제공을 위해 다음 정보를 수집할 수 있습니다.
          </Paragraph>
          <Paragraph>
            - 필수: 닉네임, 프로필 이미지, 로그인 식별자(카카오 등),
            기기 정보(운영체제, 앱 버전)
          </Paragraph>
          <Paragraph>
            - 선택: 독서 기록, 리뷰 내용, 해시태그, 선호 장르
          </Paragraph>
        </Section>

        <Section title="2. 개인정보 수집 및 이용 목적">
          <Paragraph>
            수집한 개인정보는 다음 목적을 위해 이용됩니다.
          </Paragraph>
          <Paragraph>
            - 회원 식별 및 서비스 제공
          </Paragraph>
          <Paragraph>
            - 독서 기록/리뷰 기능 제공 및 통계 처리
          </Paragraph>
          <Paragraph>
            - 공지, 문의 응대 등 고객 지원
          </Paragraph>
        </Section>

        <Section title="3. 보유 및 이용 기간">
          <Paragraph>
            회원 탈퇴 시 지체 없이 파기합니다. 다만 관계 법령에 따라 보관이
            필요한 경우 해당 기간 동안 보관할 수 있습니다.
          </Paragraph>
        </Section>

        <Section title="4. 개인정보 제3자 제공">
          <Paragraph>
            모담은 원칙적으로 개인정보를 제3자에게 제공하지 않습니다. 다만
            법령에 따라 제공이 필요한 경우에 한해 제공할 수 있습니다.
          </Paragraph>
        </Section>

        <Section title="5. 개인정보 처리 위탁">
          <Paragraph>
            서비스 운영을 위해 일부 업무를 외부에 위탁할 수 있으며, 이 경우
            관련 법령을 준수하여 안전하게 관리합니다.
          </Paragraph>
        </Section>

        <Section title="6. 이용자의 권리">
          <Paragraph>
            이용자는 언제든지 개인정보 열람, 수정, 삭제, 처리정지를 요청할 수
            있습니다. 설정 화면 또는 1:1 문의를 통해 요청해 주세요.
          </Paragraph>
        </Section>

        <Section title="7. 개인정보 보호를 위한 조치">
          <Paragraph>
            모담은 개인정보의 안전성 확보를 위해 접근 제한, 암호화, 내부
            관리계획 수립 등 필요한 조치를 시행합니다.
          </Paragraph>
        </Section>

        <Section title="8. 개인정보처리방침 변경">
          <Paragraph>
            본 방침이 변경되는 경우 앱 내 공지사항을 통해 안내합니다.
          </Paragraph>
        </Section>

        <Section title="9. 문의">
          <Paragraph>
            개인정보 관련 문의는 설정 &gt; 1:1 문의로 연락해 주세요.
          </Paragraph>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Paragraph({ children }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  content: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: spacing.xl,
  },
  date: {
    ...typography["detail-regular"],
    color: colors.mono[500],
    marginBottom: spacing.m,
  },
  section: {
    marginBottom: spacing.l,
  },
  sectionTitle: {
    ...typography["body-2-bold"],
    color: colors.mono[950],
    marginBottom: 6,
  },
  paragraph: {
    ...typography["body-2-regular"],
    color: colors.mono[800],
    lineHeight: 20,
    marginBottom: 6,
  },
});
