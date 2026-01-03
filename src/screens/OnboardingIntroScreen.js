import { ONBOARDING_QUOTES } from "@constants/onboardingQuotes";
import { colors } from "@theme/colors";
import { typography } from "@theme/typography";
import { splitToLines } from "@utils/textSplit";
import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

export default function OnboardingIntroScreen({ navigation }) {
  const quote = useMemo(() => {
    const idx = Math.floor(Math.random() * ONBOARDING_QUOTES.length);
    return ONBOARDING_QUOTES[idx];
  }, []);

  const lines = useMemo(() => splitToLines(quote.text, 20), [quote.text]);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("AuthGate");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <SvgXml
            xml={MODAM_LOGO_XML}
            width={180}
            height={180}
          />
        </View>

        <Text style={styles.text}>
          {lines.map((line, i) => (
            <Text key={i}>
              {line}
              {i !== lines.length - 1 && "\n"}
            </Text>
          ))}
        </Text>
        <Text style={styles.book}>{quote.book}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
    paddingHorizontal: 58,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
  },
  logoWrap: { alignItems: "center", marginBottom: 45 },
  text: {
    ...typography["heading-4-medium"],
    textAlign: "left",
    color: colors.mono[1000],
  },
  book: {
    marginTop: 35,
    alignSelf: "flex-end",
    ...typography["body-2-regular"],
    color: colors.mono[1000],
  },
});

const MODAM_LOGO_XML = `<svg width="205" height="205" viewBox="0 0 205 205" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#paint0_angular_854_5142_clip_path)" data-figma-skip-parse="true"><g transform="matrix(-0.0180705 0.0180705 -0.0180705 -0.0180705 76.6666 25.5556)"><foreignObject x="-1555.64" y="-1555.64" width="3111.27" height="3111.27"><div xmlns="http://www.w3.org/1999/xhtml" style="background:conic-gradient(from 90deg,rgba(255, 196, 196, 1) 0deg,rgba(226, 129, 129, 1) 360deg);height:100%;width:100%;opacity:1"></div></foreignObject></g></g><rect x="51.1111" width="51.1111" height="51.1111" rx="10.2222" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_ANGULAR&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:1.0,&#34;g&#34;:0.77198529243469238,&#34;b&#34;:0.77198529243469238,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.88782048225402832,&#34;g&#34;:0.50949156284332275,&#34;b&#34;:0.50949156284332275,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:1.0,&#34;g&#34;:0.77198529243469238,&#34;b&#34;:0.77198529243469238,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.88782048225402832,&#34;g&#34;:0.50949156284332275,&#34;b&#34;:0.50949156284332275,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:-36.141014099121094,&#34;m01&#34;:-36.141014099121094,&#34;m02&#34;:112.80765533447266,&#34;m10&#34;:36.141014099121094,&#34;m11&#34;:-36.141014099121094,&#34;m12&#34;:25.555557250976562},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<g clip-path="url(#paint1_angular_854_5142_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0.0180705 -0.0180705 0.0180705 0.0180705 25.5555 76.6666)"><foreignObject x="-1555.64" y="-1555.64" width="3111.27" height="3111.27"><div xmlns="http://www.w3.org/1999/xhtml" style="background:conic-gradient(from 90deg,rgba(255, 196, 196, 1) 0deg,rgba(226, 129, 129, 1) 360deg);height:100%;width:100%;opacity:1"></div></foreignObject></g></g><rect x="51.1111" y="102.222" width="51.1111" height="51.1111" rx="10.2222" transform="rotate(-180 51.1111 102.222)" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_ANGULAR&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:1.0,&#34;g&#34;:0.77198529243469238,&#34;b&#34;:0.77198529243469238,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.88782048225402832,&#34;g&#34;:0.50949156284332275,&#34;b&#34;:0.50949156284332275,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:1.0,&#34;g&#34;:0.77198529243469238,&#34;b&#34;:0.77198529243469238,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.88782048225402832,&#34;g&#34;:0.50949156284332275,&#34;b&#34;:0.50949156284332275,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:36.141017913818359,&#34;m01&#34;:36.141010284423828,&#34;m02&#34;:-10.585484504699707,&#34;m10&#34;:-36.141010284423828,&#34;m11&#34;:36.141017913818359,&#34;m12&#34;:76.666603088378906},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<rect y="51.1111" width="51.1111" height="51.1111" rx="10.2222" transform="rotate(-90 0 51.1111)" fill="#FFC5C5"/>
<rect x="51.1111" y="102.222" width="51.1111" height="51.1111" rx="10.2222" transform="rotate(-90 51.1111 102.222)" fill="#FFC5C5"/>
<rect x="153.333" y="102.222" width="51.1111" height="51.1111" rx="10.2222" fill="#FFC5C5"/>
<rect x="102.222" y="153.333" width="51.1111" height="51.1111" rx="10.2222" fill="#FFC5C5"/>
<g clip-path="url(#paint2_angular_854_5142_clip_path)" data-figma-skip-parse="true"><g transform="matrix(-0.0180705 -0.0180705 0.0180705 -0.0180705 178.889 178.889)"><foreignObject x="-1555.64" y="-1555.64" width="3111.27" height="3111.27"><div xmlns="http://www.w3.org/1999/xhtml" style="background:conic-gradient(from 90deg,rgba(255, 196, 196, 1) 0deg,rgba(226, 129, 129, 1) 360deg);height:100%;width:100%;opacity:1"></div></foreignObject></g></g><rect x="204.444" y="153.333" width="51.1111" height="51.1111" rx="10.2222" transform="rotate(90 204.444 153.333)" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_ANGULAR&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:1.0,&quot;g&quot;:0.77198529243469238,&quot;b&quot;:0.77198529243469238,&quot;a&quot;:1.0},&quot;position&quot;:0.0},{&quot;color&quot;:{&quot;r&quot;:0.88782048225402832,&quot;g&quot;:0.50949156284332275,&quot;b&quot;:0.50949156284332275,&quot;a&quot;:1.0},&quot;position&quot;:1.0}],&quot;stopsVar&quot;:[{&quot;color&quot;:{&quot;r&quot;:1.0,&quot;g&quot;:0.77198529243469238,&quot;b&quot;:0.77198529243469238,&quot;a&quot;:1.0},&quot;position&quot;:0.0},{&quot;color&quot;:{&quot;r&quot;:0.88782048225402832,&quot;g&quot;:0.50949156284332275,&quot;b&quot;:0.50949156284332275,&quot;a&quot;:1.0},&quot;position&quot;:1.0}],&quot;transform&quot;:{&quot;m00&quot;:-36.141014099121094,&quot;m01&quot;:36.141014099121094,&quot;m02&quot;:178.88877868652344,&quot;m10&quot;:-36.141014099121094,&quot;m11&quot;:-36.141010284423828,&quot;m12&quot;:215.02981567382812},&quot;opacity&quot;:1.0,&quot;blendMode&quot;:&quot;NORMAL&quot;,&quot;visible&quot;:true}"/>
<g clip-path="url(#paint3_angular_854_5142_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0.0180705 0.0180705 -0.0180705 0.0180705 127.778 127.778)"><foreignObject x="-1555.64" y="-1555.64" width="3111.27" height="3111.27"><div xmlns="http://www.w3.org/1999/xhtml" style="background:conic-gradient(from 90deg,rgba(255, 196, 196, 1) 0deg,rgba(226, 129, 129, 1) 360deg);height:100%;width:100%;opacity:1"></div></foreignObject></g></g><rect x="102.222" y="153.333" width="51.1111" height="51.1111" rx="10.2222" transform="rotate(-90 102.222 153.333)" data-figma-gradient-fill="{&quot;type&quot;:&quot;GRADIENT_ANGULAR&quot;,&quot;stops&quot;:[{&quot;color&quot;:{&quot;r&quot;:1.0,&quot;g&quot;:0.77198529243469238,&quot;b&quot;:0.77198529243469238,&quot;a&quot;:1.0},&quot;position&quot;:0.0},{&quot;color&quot;:{&quot;r&quot;:0.88782048225402832,&quot;g&quot;:0.50949156284332275,&quot;b&quot;:0.50949156284332275,&quot;a&quot;:1.0},&quot;position&quot;:1.0}],&quot;stopsVar&quot;:[{&quot;color&quot;:{&quot;r&quot;:1.0,&quot;g&quot;:0.77198529243469238,&quot;b&quot;:0.77198529243469238,&quot;a&quot;:1.0},&quot;position&quot;:0.0},{&quot;color&quot;:{&quot;r&quot;:0.88782048225402832,&quot;g&quot;:0.50949156284332275,&quot;b&quot;:0.50949156284332275,&quot;a&quot;:1.0},&quot;position&quot;:1.0}],&quot;transform&quot;:{&quot;m00&quot;:36.141014099121094,&quot;m01&quot;:-36.141014099121094,&quot;m02&quot;:127.77772521972656,&quot;m10&quot;:36.141010284423828,&quot;m11&quot;:36.141014099121094,&quot;m12&quot;:91.636680603027344},&quot;opacity&quot;:1.0,&quot;blendMode&quot;:&quot;NORMAL&quot;,&quot;visible&quot;:true}"/>
<path d="M0 148.222C6.71199 148.222 13.3585 149.544 19.5596 152.113C25.7604 154.681 31.3946 158.446 36.1406 163.192C40.8867 167.938 44.6521 173.573 47.2207 179.774C49.7892 185.975 51.1113 192.622 51.1113 199.333L50.4824 199.33C43.9844 199.25 37.5591 197.931 31.5518 195.443C25.3507 192.874 19.7158 189.109 14.9697 184.363C10.2238 179.617 6.45913 173.983 3.89062 167.782C1.32205 161.581 5.86676e-07 154.934 0 148.222Z" fill="#426B1F"/>
<path d="M51.1111 199.333C57.8231 199.333 64.4696 198.011 70.6707 195.443C76.8717 192.874 82.5066 189.109 87.2527 184.363C91.9986 179.617 95.7633 173.982 98.3318 167.781C100.9 161.58 102.222 154.934 102.222 148.222L101.594 148.226C95.0955 148.306 88.6702 149.624 82.6628 152.113C76.462 154.681 70.8278 158.446 66.0818 163.192C61.3357 167.938 57.5703 173.573 55.0017 179.774C52.4332 185.975 51.1111 192.621 51.1111 199.333Z" fill="#426B1F"/>
<path d="M204.444 0C204.444 6.71199 203.122 13.3585 200.554 19.5596C197.985 25.7604 194.221 31.3946 189.475 36.1406C184.729 40.8867 179.094 44.6521 172.893 47.2207C166.692 49.7892 160.045 51.1113 153.333 51.1113L153.337 50.4824C153.417 43.9844 154.735 37.5591 157.224 31.5518C159.792 25.3507 163.558 19.7158 168.304 14.9697C173.05 10.2238 178.684 6.45914 184.885 3.89063C191.086 1.32206 197.732 7.6342e-06 204.444 0Z" fill="#426B1F"/>
<path d="M153.333 51.1111C153.333 57.8231 154.655 64.4696 157.224 70.6707C159.792 76.8717 163.557 82.5066 168.303 87.2527C173.049 91.9987 178.684 95.7632 184.885 98.3318C191.086 100.9 197.733 102.222 204.445 102.222L204.441 101.594C204.361 95.0955 203.042 88.6702 200.554 82.6628C197.985 76.4618 194.22 70.8279 189.474 66.0818C184.728 61.3358 179.094 57.5703 172.893 55.0017C166.692 52.4332 160.045 51.1111 153.333 51.1111Z" fill="#426B1F"/>
<path d="M153.333 0C153.333 6.71199 152.011 13.3585 149.443 19.5596C146.874 25.7606 143.109 31.3946 138.363 36.1406C133.616 40.8867 127.983 44.6521 121.781 47.2207C115.58 49.7893 108.934 51.1113 102.222 51.1113L102.226 50.4824C102.306 43.9844 103.624 37.5592 106.113 31.5518C108.681 25.3507 112.446 19.7158 117.192 14.9697C121.938 10.2236 127.573 6.4592 133.774 3.89063C139.975 1.32205 146.621 -5.51948e-07 153.333 0Z" fill="#426B1F"/>
<path d="M102.222 51.1111C102.222 57.8231 103.544 64.4696 106.113 70.6707C108.681 76.8717 112.446 82.5066 117.192 87.2527C121.938 91.9988 127.573 95.7632 133.774 98.3318C139.975 100.9 146.621 102.222 153.333 102.222L153.33 101.594C153.25 95.0955 151.931 88.6702 149.443 82.6628C146.874 76.4618 143.109 70.8279 138.363 66.0818C133.617 61.3357 127.983 57.5703 121.782 55.0017C115.581 52.4331 108.934 51.1111 102.222 51.1111Z" fill="#426B1F"/>
<rect x="56.2222" y="102.222" width="97.1111" height="10.2222" rx="5.11111" transform="rotate(90 56.2222 102.222)" fill="#426B1F"/>
<rect x="204.444" y="56.2222" width="51.1111" height="10.2222" rx="5.11111" transform="rotate(-180 204.444 56.2222)" fill="#426B1F"/>
<defs>
<clipPath id="paint0_angular_854_5142_clip_path"><rect x="51.1111" width="51.1111" height="51.1111" rx="10.2222"/></clipPath><clipPath id="paint1_angular_854_5142_clip_path"><rect x="51.1111" y="102.222" width="51.1111" height="51.1111" rx="10.2222" transform="rotate(-180 51.1111 102.222)"/></clipPath><clipPath id="paint2_angular_854_5142_clip_path"><rect x="204.444" y="153.333" width="51.1111" height="51.1111" rx="10.2222" transform="rotate(90 204.444 153.333)"/></clipPath><clipPath id="paint3_angular_854_5142_clip_path"><rect x="102.222" y="153.333" width="51.1111" height="51.1111" rx="10.2222" transform="rotate(-90 102.222 153.333)"/></clipPath></defs>
</svg>`;
