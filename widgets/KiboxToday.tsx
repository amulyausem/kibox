import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { HomeWidgetProps } from '@/domain/homeWidget';

function KiboxToday(props: HomeWidgetProps, environment: WidgetEnvironment) {
  'widget';
  const ink = environment.colorScheme === 'dark' ? '#f4f6f7' : '#0f1416';
  const muted = environment.colorScheme === 'dark' ? '#9aa3aa' : '#667079';
  return (
    <VStack modifiers={[padding({ all: 14 })]}>
      <Text modifiers={[font({ weight: 'bold', size: 13 }), foregroundStyle('#5B8A81')]}>Kibox</Text>
      <Text modifiers={[font({ weight: 'bold', size: environment.widgetFamily === 'systemSmall' ? 16 : 20 }), foregroundStyle(ink)]}>
        {props.title}
      </Text>
      {props.line1 ? (
        <Text modifiers={[font({ size: 14 }), foregroundStyle(ink)]}>{props.line1}</Text>
      ) : null}
      {environment.widgetFamily !== 'systemSmall' && props.line2 ? (
        <Text modifiers={[font({ size: 14 }), foregroundStyle(ink)]}>{props.line2}</Text>
      ) : null}
      {props.line3 ? (
        <Text modifiers={[font({ size: 12 }), foregroundStyle(muted)]}>{props.line3}</Text>
      ) : null}
    </VStack>
  );
}

export default createWidget('KiboxToday', KiboxToday);
