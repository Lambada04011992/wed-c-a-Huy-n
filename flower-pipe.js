/**
 * LISTEN & WATER THE FLOWER – TƯỚI HOA MẪU CÂU (GLOBAL SUCCESS 5)
 * Inspired by interactive phonics/listening hose-to-flower game:
 * - Left: 3 colorful speaker hose nozzles (tap to listen / drag hose)
 * - Center: 3 Activity 2 (Listen, point and say) Lesson 1 & 2 sentence cards
 * - Right: 3 potted buds that bloom into smiling flowers when water flows!
 * - Custom Web Audio SFX: speaker ping, bubbling water stream, bloom chime, gentle boing
 */
(function (global) {
  "use strict";

  const UNIT_LISTEN_POINT_SAY = {
    1: [
      { lesson: 1, en: "Can you tell me about yourself? — I'm in Class 5A.", vi: "Bạn kể về bản thân được không? — Mình học lớp 5A.", icon: "🏫" },
      { lesson: 1, en: "Can you tell me about yourself? — I live in the countryside.", vi: "Bạn kể về bản thân được không? — Mình sống ở nông thôn.", icon: "🌾" },
      { lesson: 1, en: "Can you tell me about yourself? — I live in the city.", vi: "Bạn kể về bản thân được không? — Mình sống ở thành phố.", icon: "🏙️" },
      { lesson: 2, en: "What's your favourite animal? — It's a dolphin.", vi: "Con vật yêu thích của bạn là gì? — Đó là cá heo.", icon: "🐬" },
      { lesson: 2, en: "What's your favourite sport? — It's table tennis.", vi: "Môn thể thao yêu thích của bạn là gì? — Đó là bóng bàn.", icon: "🏓" },
      { lesson: 2, en: "What's your favourite food? — It's a sandwich.", vi: "Món ăn yêu thích của bạn là gì? — Đó là bánh mì kẹp.", icon: "🥪" }
    ],
    2: [
      { lesson: 1, en: "Do you live in this house? — Yes, I do.", vi: "Bạn có sống trong ngôi nhà này không? — Có, mình có.", icon: "🏠" },
      { lesson: 1, en: "Do you live in this flat? — No, I don't. I live in a house.", vi: "Bạn có sống ở căn hộ này không? — Không. Mình sống ở nhà riêng.", icon: "🚪" },
      { lesson: 1, en: "Do you live in this building? — Yes, I do.", vi: "Bạn có sống ở toà nhà này không? — Có, mình có.", icon: "🏢" },
      { lesson: 2, en: "What's your address? — It's 15 Ba Dinh Street.", vi: "Địa chỉ của bạn là gì? — Số 15 đường Ba Đình.", icon: "📍" },
      { lesson: 2, en: "What's your address? — It's 23 Queen Street.", vi: "Địa chỉ của bạn là gì? — Số 23 đường Queen.", icon: "🏡" },
      { lesson: 2, en: "What's your address? — It's 93 Oxford Street.", vi: "Địa chỉ của bạn là gì? — Số 93 đường Oxford.", icon: "📬" }
    ],
    3: [
      { lesson: 1, en: "What nationality is he? — He's Australian.", vi: "Cậu ấy quốc tịch gì? — Cậu ấy là người Úc.", icon: "🦘" },
      { lesson: 1, en: "What nationality is she? — She's Malaysian.", vi: "Cô ấy quốc tịch gì? — Cô ấy là người Ma-lai-xi-a.", icon: "🏙️" },
      { lesson: 1, en: "What nationality is she? — She's Japanese.", vi: "Cô ấy quốc tịch gì? — Cô ấy là người Nhật Bản.", icon: "🌸" },
      { lesson: 2, en: "What's she like? — She's friendly.", vi: "Bạn ấy tính tình thế nào? — Bạn ấy thân thiện.", icon: "😊" },
      { lesson: 2, en: "What's he like? — He's helpful.", vi: "Cậu ấy thế nào? — Cậu ấy hay giúp đỡ mọi người.", icon: "🤝" },
      { lesson: 2, en: "What's he like? — He's clever and active.", vi: "Cậu ấy thế nào? — Cậu ấy thông minh và năng động.", icon: "💡" }
    ],
    4: [
      { lesson: 1, en: "What do you like doing in your free time? — I like playing the violin.", vi: "Bạn thích làm gì lúc rảnh? — Mình thích chơi đàn vi-ô-lông.", icon: "🎻" },
      { lesson: 1, en: "What do you like doing in your free time? — I like surfing the Internet.", vi: "Bạn thích làm gì lúc rảnh? — Mình thích lướt mạng.", icon: "💻" },
      { lesson: 1, en: "What do you like doing in your free time? — I like watering the flowers.", vi: "Bạn thích làm gì lúc rảnh? — Mình thích tưới hoa.", icon: "🌷" },
      { lesson: 2, en: "What do you do at the weekend? — I always listen to music.", vi: "Cuối tuần bạn làm gì? — Mình luôn nghe nhạc.", icon: "🎵" },
      { lesson: 2, en: "What do you do at the weekend? — I usually go for a walk.", vi: "Cuối tuần bạn làm gì? — Mình thường đi dạo.", icon: "🚶" },
      { lesson: 2, en: "What do you do at the weekend? — I often play table tennis.", vi: "Cuối tuần bạn làm gì? — Mình hay chơi bóng bàn.", icon: "🏓" }
    ],
    5: [
      { lesson: 1, en: "What would you like to be in the future? — I'd like to be a firefighter.", vi: "Tương lai bạn muốn làm nghề gì? — Mình muốn làm lính cứu hoả.", icon: "🚒" },
      { lesson: 1, en: "What would you like to be in the future? — I'd like to be a gardener.", vi: "Tương lai bạn muốn làm nghề gì? — Mình muốn làm người làm vườn.", icon: "🌻" },
      { lesson: 1, en: "What would you like to be in the future? — I'd like to be a writer.", vi: "Tương lai bạn muốn làm nghề gì? — Mình muốn làm nhà văn.", icon: "✍️" },
      { lesson: 2, en: "Why would you like to be a gardener? — Because I'd like to grow flowers.", vi: "Sao bạn muốn làm người làm vườn? — Vì mình muốn trồng hoa.", icon: "🌷" },
      { lesson: 2, en: "Why would you like to be a reporter? — Because I'd like to report the news.", vi: "Sao bạn muốn làm phóng viên? — Vì mình muốn đưa tin tức.", icon: "🎤" },
      { lesson: 2, en: "Why would you like to be a teacher? — Because I'd like to teach children.", vi: "Sao bạn muốn làm giáo viên? — Vì mình muốn dạy trẻ em.", icon: "👩‍🏫" }
    ],
    6: [
      { lesson: 1, en: "Where's the library? — It's on the second floor.", vi: "Thư viện ở đâu? — Ở tầng hai.", icon: "📚" },
      { lesson: 1, en: "Where's the music room? — It's on the ground floor.", vi: "Phòng âm nhạc ở đâu? — Ở tầng trệt.", icon: "🎶" },
      { lesson: 1, en: "Where's the art room? — It's on the third floor.", vi: "Phòng mỹ thuật ở đâu? — Ở tầng ba.", icon: "🎨" },
      { lesson: 2, en: "Could you tell me the way to the computer room? — Go upstairs.", vi: "Chỉ mình đường tới phòng tin học với? — Đi lên cầu thang.", icon: "⬆️" },
      { lesson: 2, en: "Could you tell me the way to the library? — Go past the library and turn right.", vi: "Chỉ mình đường tới thư viện với? — Đi qua thư viện rồi rẽ phải.", icon: "➡️" },
      { lesson: 2, en: "Could you tell me the way to the art room? — Go along the corridor and turn left.", vi: "Chỉ mình đường tới phòng mỹ thuật? — Đi dọc hành lang rồi rẽ trái.", icon: "🏫" }
    ],
    7: [
      { lesson: 1, en: "What school activity does he like? — He likes solving maths problems.", vi: "Cậu ấy thích hoạt động trường nào? — Cậu ấy thích giải toán.", icon: "🧮" },
      { lesson: 1, en: "What school activity does she like? — She likes doing projects.", vi: "Bạn nữ thích hoạt động gì? — Bạn ấy thích làm dự án.", icon: "🗂️" },
      { lesson: 1, en: "What school activity does he like? — He likes reading books.", vi: "Cậu ấy thích hoạt động gì? — Cậu ấy thích đọc sách.", icon: "📖" },
      { lesson: 2, en: "Why does he like solving maths problems? — Because he thinks it's useful.", vi: "Vì sao cậu ấy thích giải toán? — Vì cậu ấy thấy nó hữu ích.", icon: "💎" },
      { lesson: 2, en: "Why does she like doing projects? — Because she thinks it's interesting.", vi: "Vì sao bạn ấy thích làm dự án? — Vì bạn ấy thấy nó thú vị.", icon: "🤩" },
      { lesson: 2, en: "Why does he like playing games? — Because he thinks it's fun.", vi: "Vì sao cậu ấy thích chơi trò chơi? — Vì cậu ấy thấy nó vui.", icon: "🎉" }
    ],
    8: [
      { lesson: 1, en: "Where are the maps? — They're beside the board.", vi: "Những tấm bản đồ ở đâu? — Chúng ở bên cạnh bảng.", icon: "🗺️" },
      { lesson: 1, en: "Where are the pictures? — They're above the bookcase.", vi: "Những bức tranh ở đâu? — Chúng ở phía trên tủ sách.", icon: "🖼️" },
      { lesson: 1, en: "Where are the erasers? — They're under the desk.", vi: "Những cục tẩy ở đâu? — Chúng ở dưới gầm bàn.", icon: "🧽" },
      { lesson: 2, en: "Whose crayon is this? — It's Linh's.", vi: "Bút sáp màu này của ai? — Của Linh.", icon: "🖍️" },
      { lesson: 2, en: "Whose glue stick is this? — It's Mary's.", vi: "Hồ dán này của ai? — Của Mary.", icon: "🧴" },
      { lesson: 2, en: "Whose set square is this? — It's Trang's.", vi: "Thước ê-ke này của ai? — Của Trang.", icon: "📐" }
    ],
    9: [
      { lesson: 1, en: "Were you at the theatre yesterday? — Yes, we were.", vi: "Hôm qua các bạn có ở nhà hát không? — Có.", icon: "🎭" },
      { lesson: 1, en: "Were you at the aquarium yesterday? — Yes, we were.", vi: "Hôm qua các bạn có ở thuỷ cung không? — Có.", icon: "🐠" },
      { lesson: 1, en: "Were you at the campsite yesterday? — No, we weren't.", vi: "Hôm qua các bạn có ở khu cắm trại không? — Không.", icon: "⛺" },
      { lesson: 2, en: "What did you do yesterday? — We listened to music.", vi: "Hôm qua các bạn đã làm gì? — Chúng mình nghe nhạc.", icon: "🎧" },
      { lesson: 2, en: "What did you do yesterday? — We danced around the campfire.", vi: "Hôm qua các bạn làm gì? — Chúng mình nhảy quanh lửa trại.", icon: "🔥" },
      { lesson: 2, en: "What did you do yesterday? — We watched the fish.", vi: "Hôm qua các bạn làm gì? — Chúng mình ngắm cá.", icon: "🐟" }
    ],
    10: [
      { lesson: 1, en: "Did they go to Ba Na Hills? — Yes, they did.", vi: "Họ có đi Bà Nà Hills không? — Có.", icon: "⛰️" },
      { lesson: 1, en: "Did they go to Hoan Kiem Lake? — No, they didn't.", vi: "Họ có đi Hồ Hoàn Kiếm không? — Không.", icon: "🌊" },
      { lesson: 1, en: "Did they go to Bai Dinh Pagoda? — Yes, they did.", vi: "Họ có đi Chùa Bái Đính không? — Có.", icon: "🏯" },
      { lesson: 2, en: "What did they do there? — They visited the old buildings.", vi: "Họ đã làm gì ở đó? — Họ thăm các toà nhà cổ.", icon: "🏰" },
      { lesson: 2, en: "What did they do there? — They planted trees.", vi: "Họ đã làm gì ở đó? — Họ trồng cây.", icon: "🌱" },
      { lesson: 2, en: "What did they do there? — They walked around the lake.", vi: "Họ đã làm gì ở đó? — Họ đi bộ quanh hồ.", icon: "🌳" }
    ],
    11: [
      { lesson: 1, en: "Did you swim? — Yes, I did. I swam with my mother.", vi: "Bạn có bơi không? — Có, mình bơi cùng mẹ.", icon: "🏊" },
      { lesson: 1, en: "Did you collect seashells? — Yes, I did.", vi: "Bạn có nhặt vỏ sò không? — Có.", icon: "🐚" },
      { lesson: 1, en: "Did you walk on the beach? — Yes, I did.", vi: "Bạn có đi dạo trên bãi biển không? — Có.", icon: "🏖️" },
      { lesson: 2, en: "What did your family do in Ha Long Bay? — We took a boat trip.", vi: "Gia đình bạn làm gì ở Vịnh Hạ Long? — Chúng mình đi thuyền tham quan.", icon: "⛵" },
      { lesson: 2, en: "What did your family do in Ha Long Bay? — We ate seafood.", vi: "Gia đình bạn làm gì ở Vịnh Hạ Long? — Chúng mình ăn hải sản.", icon: "🦐" },
      { lesson: 2, en: "What did your family do there? — We bought souvenirs.", vi: "Gia đình bạn làm gì ở đó? — Chúng mình mua quà lưu niệm.", icon: "🎁" }
    ],
    12: [
      { lesson: 1, en: "Will you decorate the house for Tet? — Yes, I will.", vi: "Bạn sẽ trang trí nhà đón Tết chứ? — Có, mình sẽ làm.", icon: "🏮" },
      { lesson: 1, en: "Will you buy peach blossoms? — Yes, I will.", vi: "Bạn sẽ mua hoa đào chứ? — Có, mình sẽ mua.", icon: "🌸" },
      { lesson: 1, en: "Will you make spring rolls? — Yes, I will.", vi: "Bạn sẽ gói nem rán chứ? — Có, mình sẽ làm.", icon: "🥟" },
      { lesson: 2, en: "Where will you go at Tet? — I'll go to a fireworks show.", vi: "Tết bạn sẽ đi đâu? — Mình sẽ đi xem bắn pháo hoa.", icon: "🎆" },
      { lesson: 2, en: "Where will you go at Tet? — I'll go to a flower festival.", vi: "Tết bạn sẽ đi đâu? — Mình sẽ đi hội chợ hoa.", icon: "💐" },
      { lesson: 2, en: "Where will you go at Tet? — I'll go to my grandparents' house.", vi: "Tết bạn sẽ đi đâu? — Mình sẽ về nhà ông bà.", icon: "🏡" }
    ],
    13: [
      { lesson: 1, en: "What will you do on Children's Day? — We'll sing and dance.", vi: "Ngày Quốc tế Thiếu nhi các bạn làm gì? — Chúng mình sẽ hát và múa.", icon: "🎈" },
      { lesson: 1, en: "What will you do on Teachers' Day? — We'll sing for our teachers.", vi: "Ngày Nhà giáo các bạn làm gì? — Chúng mình sẽ hát tặng thầy cô.", icon: "💐" },
      { lesson: 1, en: "What will you do on Sports Day? — We'll play badminton.", vi: "Ngày Hội thể thao các bạn làm gì? — Chúng mình sẽ chơi cầu lông.", icon: "🏸" },
      { lesson: 2, en: "What food and drinks will you have? — We'll have pizza.", vi: "Các bạn sẽ ăn uống món gì? — Chúng mình sẽ có bánh pizza.", icon: "🍕" },
      { lesson: 2, en: "What food and drinks will you have? — We'll have milk tea.", vi: "Các bạn sẽ có đồ uống gì? — Chúng mình sẽ có trà sữa.", icon: "🧋" },
      { lesson: 2, en: "What food and drinks will you have? — We'll have apple juice.", vi: "Các bạn sẽ có đồ uống gì? — Chúng mình sẽ có nước ép táo.", icon: "🧃" }
    ],
    14: [
      { lesson: 1, en: "How does he stay healthy? — He does morning exercise.", vi: "Cậu ấy giữ sức khoẻ bằng cách nào? — Tập thể dục buổi sáng.", icon: "🤸" },
      { lesson: 1, en: "How does she stay healthy? — She drinks fresh juice.", vi: "Bạn ấy giữ sức khoẻ thế nào? — Bạn ấy uống nước ép tươi.", icon: "🍊" },
      { lesson: 1, en: "How does he stay healthy? — He eats healthy food and plays sports.", vi: "Cậu ấy giữ sức khoẻ thế nào? — Ăn uống lành mạnh và chơi thể thao.", icon: "🥦" },
      { lesson: 2, en: "How often does she do yoga? — Once a week.", vi: "Bạn ấy tập yoga bao lâu một lần? — Một tuần một lần.", icon: "🧘" },
      { lesson: 2, en: "How often does he play badminton? — Twice a week.", vi: "Cậu ấy chơi cầu lông bao lâu một lần? — Một tuần hai lần.", icon: "🏸" },
      { lesson: 2, en: "How often does he go swimming? — Three times a week.", vi: "Cậu ấy đi bơi bao lâu một lần? — Ba lần một tuần.", icon: "🏊" }
    ],
    15: [
      { lesson: 1, en: "What's the matter? — I have a headache.", vi: "Bạn bị sao thế? — Mình bị đau đầu.", icon: "🤕" },
      { lesson: 1, en: "What's the matter? — I have a sore throat.", vi: "Bạn bị sao thế? — Mình bị đau họng.", icon: "😷" },
      { lesson: 1, en: "What's the matter? — I have a toothache.", vi: "Bạn bị sao thế? — Mình bị đau răng.", icon: "🦷" },
      { lesson: 2, en: "I have a headache. — You should have a rest.", vi: "Mình bị đau đầu. — Bạn nên nghỉ ngơi.", icon: "🛌" },
      { lesson: 2, en: "I have a toothache. — You should go to the dentist.", vi: "Mình bị đau răng. — Bạn nên đi khám nha sĩ.", icon: "🩺" },
      { lesson: 2, en: "I have a sore throat. — You should drink warm water.", vi: "Mình bị đau họng. — Bạn nên uống nước ấm.", icon: "🥛" }
    ],
    16: [
      { lesson: 1, en: "How's the weather in Ha Noi in winter? — It's cold and dry.", vi: "Thời tiết Hà Nội mùa đông thế nào? — Trời lạnh và khô.", icon: "❄️" },
      { lesson: 1, en: "How's the weather in spring? — It's warm and rainy.", vi: "Thời tiết mùa xuân thế nào? — Trời ấm và có mưa.", icon: "🌷" },
      { lesson: 1, en: "How's the weather in summer? — It's hot and sunny.", vi: "Thời tiết mùa hè thế nào? — Trời nóng và có nắng.", icon: "☀️" },
      { lesson: 2, en: "What do you usually wear in winter? — I wear a jumper.", vi: "Mùa đông bạn thường mặc gì? — Mình mặc áo len.", icon: "🧶" },
      { lesson: 2, en: "What do you usually wear in spring? — I wear a blouse.", vi: "Mùa xuân bạn thường mặc gì? — Mình mặc áo sơ mi.", icon: "👚" },
      { lesson: 2, en: "What do you usually wear in autumn? — I wear jeans.", vi: "Mùa thu bạn thường mặc gì? — Mình mặc quần bò.", icon: "👖" }
    ],
    17: [
      { lesson: 1, en: "Who are the main characters in the story? — They're Snow White and seven dwarfs.", vi: "Nhân vật chính trong truyện là ai? — Bạch Tuyết và bảy chú lùn.", icon: "👸" },
      { lesson: 1, en: "Who are the main characters? — They're the ant and the grasshopper.", vi: "Nhân vật chính là ai? — Kiến và châu chấu.", icon: "🐜" },
      { lesson: 1, en: "Who are the main characters? — They're the tortoise and the hare.", vi: "Nhân vật chính là ai? — Rùa và thỏ.", icon: "🐢" },
      { lesson: 2, en: "How did he run? — He ran fast.", vi: "Cậu ấy chạy như thế nào? — Cậu ấy chạy nhanh.", icon: "🐇" },
      { lesson: 2, en: "How did the ant work? — The ant worked hard.", vi: "Kiến làm việc thế nào? — Kiến làm việc chăm chỉ.", icon: "💪" },
      { lesson: 2, en: "How did the crow sing? — The crow sang beautifully.", vi: "Con quạ hót thế nào? — Con quạ hót rất hay.", icon: "🐦" }
    ],
    18: [
      { lesson: 1, en: "Where do you want to visit? — I want to visit Dragon Bridge.", vi: "Bạn muốn thăm nơi nào? — Mình muốn thăm Cầu Rồng.", icon: "🐉" },
      { lesson: 1, en: "Where do you want to visit? — I want to visit Ha Noi Opera House.", vi: "Bạn muốn thăm nơi nào? — Mình muốn thăm Nhà hát lớn Hà Nội.", icon: "🏛️" },
      { lesson: 1, en: "Where do you want to visit? — I want to visit Ngo Mon Square.", vi: "Bạn muốn thăm nơi nào? — Mình muốn thăm Quảng trường Ngọ Môn.", icon: "🏯" },
      { lesson: 2, en: "How can I get there? — You can get there by bus.", vi: "Tôi đến đó bằng cách nào? — Bạn có thể đi bằng xe buýt.", icon: "🚌" },
      { lesson: 2, en: "How can I get there? — You can get there by bicycle.", vi: "Tôi đến đó bằng cách nào? — Bạn có thể đi bằng xe đạp.", icon: "🚲" },
      { lesson: 2, en: "How can I get there? — You can get there on foot.", vi: "Tôi đến đó bằng cách nào? — Bạn có thể đi bộ.", icon: "👟" }
    ],
    19: [
      { lesson: 1, en: "What do you think of Ban Gioc Waterfall? — I think it's peaceful.", vi: "Bạn nghĩ gì về Thác Bản Giốc? — Mình nghĩ nơi đó yên bình.", icon: "🏞️" },
      { lesson: 1, en: "What do you think of Hoi An Old Town? — I think it's exciting.", vi: "Bạn nghĩ gì về Phố cổ Hội An? — Mình nghĩ nơi đó sôi động.", icon: "✨" },
      { lesson: 1, en: "What do you think of the Twin Towers? — I think they're fantastic.", vi: "Bạn nghĩ gì về Tháp Đôi? — Mình nghĩ chúng thật tuyệt vời.", icon: "🏙️" },
      { lesson: 2, en: "How far is it from Ha Noi to Hoa Binh? — It's about 70 kilometres.", vi: "Từ Hà Nội đến Hoà Bình bao xa? — Khoảng 70 ki-lô-mét.", icon: "🛣️" },
      { lesson: 2, en: "How far is it? — It's about 40 kilometres.", vi: "Khoảng cách là bao xa? — Khoảng 40 ki-lô-mét.", icon: "📍" },
      { lesson: 2, en: "How far is it from Hue to Da Nang? — It's about 100 kilometres.", vi: "Từ Huế đến Đà Nẵng bao xa? — Khoảng 100 ki-lô-mét.", icon: "💯" }
    ],
    20: [
      { lesson: 1, en: "Where are you going to visit this summer? — I'm going to visit Phu Quoc Island.", vi: "Hè này bạn định thăm nơi nào? — Mình định thăm Đảo Phú Quốc.", icon: "🏝️" },
      { lesson: 1, en: "Where are you going to visit this summer? — I'm going to visit Huong River.", vi: "Hè này bạn định thăm nơi nào? — Mình định thăm Sông Hương.", icon: "🏞️" },
      { lesson: 1, en: "Where are you going to visit this summer? — I'm going to visit Phong Nha Cave.", vi: "Hè này bạn định thăm nơi nào? — Mình định thăm Động Phong Nha.", icon: "⛰️" },
      { lesson: 2, en: "What are you going to do this summer? — I'm going to go camping.", vi: "Hè này bạn định làm gì? — Mình định đi cắm trại.", icon: "⛺" },
      { lesson: 2, en: "What are you going to do this summer? — I'm going to join a music club.", vi: "Hè này bạn định làm gì? — Mình định tham gia CLB âm nhạc.", icon: "🎸" },
      { lesson: 2, en: "What are you going to do this summer? — I'm going to practise swimming.", vi: "Hè này bạn định làm gì? — Mình định tập bơi.", icon: "🏊" }
    ]
  };

  const HOSE_COLORS = [
    { name: "blue", btn: "linear-gradient(145deg, #fb923c, #f97316)", stroke: "#38bdf8", glow: "rgba(56, 189, 248, 0.55)", petal: "#f472b6", center: "#fde047" },
    { name: "pink", btn: "linear-gradient(145deg, #fb923c, #f97316)", stroke: "#fb7185", glow: "rgba(251, 113, 133, 0.55)", petal: "#60a5fa", center: "#fef08a" },
    { name: "mint", btn: "linear-gradient(145deg, #fb923c, #f97316)", stroke: "#34d399", glow: "rgba(52, 211, 153, 0.55)", petal: "#facc15", center: "#fb923c" }
  ];

  // Speaker nozzle ring colors matching the sample video (purple/blue, orange/coral, green/mint)
  const NOZZLE_PIPES = [
    { pipe: "#60a5fa", ring: "#818cf8", water: "#7dd3fc" },
    { pipe: "#fb7185", ring: "#fb923c", water: "#38bdf8" },
    { pipe: "#34d399", ring: "#14b8a6", water: "#67e8f9" }
  ];

  let runtime = {
    lessonFilter: "all", // 'all' | '1' | '2'
    showHint: false,
    roundIdx: 0,
    rounds: [],
    matched: {}, // roundIdx -> { [sentenceId]: speakerIdx }
    selectedSpeakerIdx: null,
    drag: null,
    audioCtx: null,
    resizeHandler: null,
    totalScore: 0,
    totalFlowers: 0
  };

  function getBridge() {
    return global.PlaylandBridge || {};
  }

  function isSoundOn() {
    const st = getBridge().getState?.() || global.state;
    return st ? !!st.soundOn : true;
  }

  function getAudioCtx() {
    if (!runtime.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      runtime.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (runtime.audioCtx && runtime.audioCtx.state === "suspended") {
      runtime.audioCtx.resume().catch(() => {});
    }
    return runtime.audioCtx;
  }

  function playSpeakerPing() {
    if (!isSoundOn()) return;
    const ctx = getAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.08);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.11, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.14);
  }

  function playWaterAndBloomSFX() {
    if (!isSoundOn()) return;
    const ctx = getAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Soft filtered water stream whoosh (0.45s)
    const bufSize = Math.floor(ctx.sampleRate * 0.48);
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.exponentialRampToValueAtTime(1650, now + 0.42);
    filter.Q.value = 3.2;

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.001, now);
    nGain.gain.exponentialRampToValueAtTime(0.15, now + 0.06);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
    noise.connect(filter); filter.connect(nGain); nGain.connect(ctx.destination);
    noise.start(now); noise.stop(now + 0.48);

    // 2. Playful water bubble glugs
    [0.05, 0.14, 0.24, 0.34].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      const base = 420 + i * 115;
      osc.frequency.setValueAtTime(base, now + offset);
      osc.frequency.exponentialRampToValueAtTime(base * 1.65, now + offset + 0.075);
      g.gain.setValueAtTime(0.001, now + offset);
      g.gain.exponentialRampToValueAtTime(0.12, now + offset + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.09);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(now + offset); osc.stop(now + offset + 0.1);
    });

    // 3. Cheerful bloom chord sparkle at 0.38s
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const t = now + 0.36 + idx * 0.06;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.11, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.28);
    });
  }

  function playWrongBoingSFX() {
    if (!isSoundOn()) return;
    const ctx = getAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.22);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.28);
  }

  function speakSentence(text) {
    if (!text) return;
    const b = getBridge();
    if (typeof b.speakEnglish === "function") {
      b.speakEnglish(text.replace(/\s*—\s*/g, ". "), 0.86);
      return;
    }
    if (!isSoundOn() || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\s*—\s*/g, ". "));
    u.lang = "en-US";
    u.rate = 0.86;
    window.speechSynthesis.speak(u);
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function injectStyles() {
    if (document.getElementById("flower-pipe-styles")) return;
    const style = document.createElement("style");
    style.id = "flower-pipe-styles";
    style.textContent = `
      .fp-garden {
        position: relative;
        border-radius: 28px;
        padding: 16px 16px 26px;
        background:
          radial-gradient(circle at 14% 16%, rgba(255,255,255,0.16) 0 2px, transparent 3px),
          radial-gradient(circle at 82% 20%, rgba(255,255,255,0.2) 0 2px, transparent 3px),
          radial-gradient(circle at 50% 10%, rgba(125,211,252,0.22) 0, transparent 48%),
          linear-gradient(180deg, #1b2560 0%, #263d8d 72%, #235867 100%);
        border: 4px solid #ffffff;
        box-shadow: 0 14px 34px rgba(27, 37, 96, 0.28);
        overflow: hidden;
        color: #ffffff;
      }
      .fp-lawn {
        position: absolute;
        left: -4%;
        right: -4%;
        bottom: -24px;
        height: 64px;
        border-radius: 50% 50% 0 0 / 34px 34px 0 0;
        background: linear-gradient(180deg, #4ade80 0%, #16a34a 100%);
        border-top: 4px solid #86efac;
        pointer-events: none;
        z-index: 0;
      }
      .fp-hud {
        position: relative;
        z-index: 2;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 12px;
      }
      .fp-prompt-pill {
        position: relative;
        z-index: 2;
        max-width: 720px;
        margin: 0 auto 14px;
        padding: 9px 18px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.96);
        color: #1e293b;
        font-size: 14.5px;
        font-weight: 800;
        text-align: center;
        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.2);
      }
      .fp-board {
        position: relative;
        z-index: 2;
        display: grid;
        grid-template-columns: 112px minmax(0, 1fr) 104px;
        gap: 18px;
        align-items: stretch;
        min-height: 332px;
        padding: 6px 4px;
        touch-action: none;
        user-select: none;
      }
      .fp-wires-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 3;
        overflow: visible;
      }
      .fp-col {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        gap: 18px;
        position: relative;
        z-index: 4;
      }
      .fp-speaker-row {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 0;
      }
      .fp-speaker-btn {
        width: 74px;
        height: 74px;
        border-radius: 22px;
        background: radial-gradient(circle at 30% 28%, #ffb46b 0%, #f97316 62%, #c2410c 100%);
        border: 3.5px solid #ffffff;
        box-shadow: 0 7px 0 #9a3412, 0 12px 24px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        color: #ffffff;
        cursor: grab;
        flex-shrink: 0;
        touch-action: none;
        transition: transform 0.16s ease, box-shadow 0.16s ease;
      }
      .fp-speaker-btn:hover { transform: scale(1.06); }
      .fp-speaker-btn.is-active {
        transform: scale(1.09);
        box-shadow: 0 0 0 5px #fde047, 0 7px 0 #9a3412, 0 14px 26px rgba(253, 224, 71, 0.45);
      }
      .fp-speaker-btn.is-done {
        opacity: 0.72;
        filter: saturate(0.85);
      }
      .fp-nozzle-port {
        width: 34px;
        height: 18px;
        border-radius: 0 10px 10px 0;
        border: 2.5px solid #ffffff;
        border-left: none;
        margin-left: -2px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 4px;
        cursor: grab;
        touch-action: none;
      }
      .fp-nozzle-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #ffffff;
      }

      .fp-sentence-card {
        position: relative;
        min-height: 82px;
        padding: 12px 18px 12px 24px;
        border-radius: 28px;
        background: #ffffff;
        color: #1e293b;
        border: 4px solid #e0e7ff;
        box-shadow: 0 8px 0 #c7d2fe, 0 14px 26px rgba(15, 23, 42, 0.24);
        display: flex;
        flex-direction: column;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
      }
      .fp-sentence-card:hover { transform: translateY(-2px); border-color: #93c5fd; }
      .fp-sentence-card.is-drop-hover {
        transform: scale(1.03);
        border-color: #fde047;
        box-shadow: 0 0 0 5px rgba(253, 224, 71, 0.45), 0 8px 0 #c7d2fe;
      }
      .fp-sentence-card.is-watered {
        background: linear-gradient(135deg, #ecfeff, #f0fdf4);
        border-color: #34d399;
        box-shadow: 0 6px 0 #10b981, 0 12px 24px rgba(16, 185, 129, 0.3);
      }
      .fp-sentence-card.is-wrong {
        border-color: #fb7185;
        animation: fpShake 0.4s ease;
      }
      .fp-socket-left {
        position: absolute;
        left: -13px;
        top: 50%;
        transform: translateY(-50%);
        width: 22px;
        height: 28px;
        border-radius: 10px;
        background: #e2e8f0;
        border: 3px solid #ffffff;
        box-shadow: 0 2px 6px rgba(15,23,42,0.22);
      }
      .fp-sentence-card.is-watered .fp-socket-left { background: #38bdf8; }
      .fp-socket-right {
        position: absolute;
        right: -22px;
        top: 50%;
        transform: translateY(-50%);
        width: 22px;
        height: 12px;
        background: linear-gradient(180deg, #94a3b8, #64748b);
        border-top: 2px solid #fff;
        border-bottom: 2px solid #fff;
      }
      .fp-sentence-card.is-watered .fp-socket-right {
        background: linear-gradient(180deg, #7dd3fc, #0284c7);
      }

      .fp-pot-slot {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 82px;
        position: relative;
      }
      .fp-flower-svg {
        width: 88px;
        height: 88px;
        overflow: visible;
        transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .fp-flower-svg.is-bloomed {
        animation: fpBloomPop 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      @keyframes fpBloomPop {
        0% { transform: scale(0.82) translateY(8px); }
        55% { transform: scale(1.16) translateY(-6px); }
        100% { transform: scale(1.04) translateY(0); }
      }
      @keyframes fpShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-8px); }
        50% { transform: translateX(8px); }
        75% { transform: translateX(-4px); }
      }
      @keyframes fpWaterDash {
        from { stroke-dashoffset: 36; }
        to { stroke-dashoffset: 0; }
      }
      .fp-water-flow {
        stroke-dasharray: 10 8;
        animation: fpWaterDash 0.55s linear infinite;
      }

      @media (max-width: 680px) {
        .fp-board {
          grid-template-columns: 78px minmax(0, 1fr) 72px;
          gap: 10px;
          min-height: 300px;
        }
        .fp-speaker-btn { width: 58px; height: 58px; font-size: 25px; border-radius: 18px; }
        .fp-nozzle-port { width: 22px; height: 15px; }
        .fp-sentence-card { padding: 10px 12px 10px 16px; min-height: 74px; border-radius: 22px; }
        .fp-flower-svg { width: 70px; height: 70px; }
      }
    `;
    document.head.appendChild(style);
  }

  function buildSentencePool(lessonSet) {
    const unitId = lessonSet?.unitId || (getBridge().getState?.()?.ui?.unitId) || 1;
    let pool = [];

    if (UNIT_LISTEN_POINT_SAY[unitId] && !String(lessonSet?.id || "").startsWith("custom_") && !String(lessonSet?.id || "").startsWith("theme_")) {
      pool = UNIT_LISTEN_POINT_SAY[unitId].slice();
    } else if (Array.isArray(lessonSet?.items) && lessonSet.items.length > 0) {
      pool = lessonSet.items.map((it, idx) => ({
        lesson: idx % 2 === 0 ? 1 : 2,
        en: (it.ex || it.en || "").trim(),
        vi: it.vi || "",
        icon: it.icon || "🌸"
      })).filter(x => x.en);
    } else {
      pool = UNIT_LISTEN_POINT_SAY[1].slice();
    }

    if (runtime.lessonFilter === "1") {
      const f = pool.filter(x => x.lesson === 1);
      if (f.length >= 2) pool = f;
    } else if (runtime.lessonFilter === "2") {
      const f = pool.filter(x => x.lesson === 2);
      if (f.length >= 2) pool = f;
    }

    // Build rounds of 3 sentences (pad cleanly from pool if needed)
    const clean = pool.map((x, idx) => ({ ...x, uid: `s_${idx}` }));
    const rounds = [];
    for (let i = 0; i < clean.length; i += 3) {
      let chunk = clean.slice(i, i + 3);
      while (chunk.length < 3 && clean.length >= 3) {
        const extra = clean[(i + chunk.length) % clean.length];
        if (!chunk.some(c => c.uid === extra.uid)) chunk.push(extra);
        else break;
      }
      const speakers = shuffle(chunk);
      const cards = shuffle(chunk);
      rounds.push({ speakers, cards });
    }
    return rounds;
  }

  function renderFlowerPotSvg(rowIdx, bloomed) {
    const theme = HOSE_COLORS[rowIdx % HOSE_COLORS.length];
    if (!bloomed) {
      return `
        <svg class="fp-flower-svg" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Cute sprouting bud waiting for water -->
          <path d="M48 64 C48 52, 46 42, 48 34" stroke="#4ade80" stroke-width="5" stroke-linecap="round"/>
          <path d="M48 54 C36 50, 32 41, 40 39 C45 38, 48 46, 48 54Z" fill="#86efac" stroke="#16a34a" stroke-width="2"/>
          <path d="M48 50 C60 46, 63 38, 55 36 C50 35, 48 43, 48 50Z" fill="#4ade80" stroke="#16a34a" stroke-width="2"/>
          <ellipse cx="48" cy="30" rx="8" ry="10" fill="${theme.petal}" opacity="0.65" stroke="#ffffff" stroke-width="2"/>
          <!-- Pot -->
          <polygon points="28,64 68,64 62,88 34,88" fill="#ea8c44" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>
          <rect x="24" y="58" width="48" height="9" rx="4.5" fill="#f5a15e" stroke="#ffffff" stroke-width="2.5"/>
          <circle cx="43" cy="75" r="2" fill="#7c2d12"/>
          <circle cx="53" cy="75" r="2" fill="#7c2d12"/>
          <path d="M45 80 Q48 78 51 80" stroke="#7c2d12" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
    }
    return `
      <svg class="fp-flower-svg is-bloomed" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Water splashes -->
        <text x="8" y="20" font-size="14">💧</text>
        <text x="74" y="22" font-size="14">✨</text>
        <!-- Stem & leaves -->
        <path d="M48 62 L48 34" stroke="#22c55e" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M48 54 C34 50, 29 40, 39 38 C45 37, 48 47, 48 54Z" fill="#4ade80" stroke="#ffffff" stroke-width="2"/>
        <path d="M48 50 C62 46, 66 36, 56 35 C51 34, 48 44, 48 50Z" fill="#4ade80" stroke="#ffffff" stroke-width="2"/>
        <!-- Bloomed petals -->
        <circle cx="48" cy="18" r="10" fill="${theme.petal}" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="60" cy="27" r="10" fill="${theme.petal}" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="55" cy="40" r="10" fill="${theme.petal}" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="41" cy="40" r="10" fill="${theme.petal}" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="36" cy="27" r="10" fill="${theme.petal}" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="48" cy="30" r="11" fill="${theme.center}" stroke="#ffffff" stroke-width="2.5"/>
        <!-- Happy face on flower -->
        <circle cx="44" cy="28" r="1.7" fill="#1e293b"/>
        <circle cx="52" cy="28" r="1.7" fill="#1e293b"/>
        <path d="M44.5 32.5 Q48 36 51.5 32.5" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round"/>
        <!-- Pot -->
        <polygon points="28,64 68,64 62,88 34,88" fill="#ea8c44" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>
        <rect x="24" y="58" width="48" height="9" rx="4.5" fill="#f5a15e" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="43" cy="75" r="2.1" fill="#7c2d12"/>
        <circle cx="53" cy="75" r="2.1" fill="#7c2d12"/>
        <path d="M44 79 Q48 83 52 79" stroke="#7c2d12" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  }

  function makeBezierPath(x1, y1, x2, y2) {
    const dx = Math.max(40, Math.abs(x2 - x1) * 0.52);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  }

  function drawWires() {
    const board = document.getElementById("fp-board");
    const svg = document.getElementById("fp-wires-svg");
    if (!board || !svg) return;

    const bRect = board.getBoundingClientRect();
    const round = runtime.rounds[runtime.roundIdx];
    const matchedMap = runtime.matched[runtime.roundIdx] || {};
    const paths = [];

    // 1. Draw static pipes between center cards -> right flower pots
    round.cards.forEach((cardItem, rowIdx) => {
      const cardEl = document.getElementById(`fp-card-${rowIdx}`);
      const potEl = document.getElementById(`fp-pot-${rowIdx}`);
      if (!cardEl || !potEl) return;
      const cR = cardEl.getBoundingClientRect();
      const pR = potEl.getBoundingClientRect();
      const x1 = cR.right - bRect.left;
      const y1 = cR.top + cR.height / 2 - bRect.top;
      const x2 = pR.left + 16 - bRect.left;
      const y2 = pR.top + pR.height * 0.65 - bRect.top;
      const isWatered = matchedMap[cardItem.uid] !== undefined;
      const d = makeBezierPath(x1, y1, x2, y2);
      paths.push(`<path d="${d}" stroke="${isWatered ? '#0284c7' : '#64748b'}" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.9"/>`);
      if (isWatered) {
        paths.push(`<path d="${d}" stroke="#7dd3fc" stroke-width="5" stroke-linecap="round" fill="none" class="fp-water-flow"/>`);
      }
    });

    // 2. Draw matched hoses (speaker nozzle -> center sentence socket)
    Object.entries(matchedMap).forEach(([uid, spkIdx]) => {
      const cardIdx = round.cards.findIndex(c => c.uid === uid);
      if (cardIdx < 0) return;
      const portEl = document.getElementById(`fp-nozzle-${spkIdx}`);
      const sockEl = document.getElementById(`fp-sock-${cardIdx}`);
      if (!portEl || !sockEl) return;
      const pR = portEl.getBoundingClientRect();
      const sR = sockEl.getBoundingClientRect();
      const x1 = pR.right - bRect.left;
      const y1 = pR.top + pR.height / 2 - bRect.top;
      const x2 = sR.left + sR.width / 2 - bRect.left;
      const y2 = sR.top + sR.height / 2 - bRect.top;
      const col = NOZZLE_PIPES[spkIdx % NOZZLE_PIPES.length];
      const d = makeBezierPath(x1, y1, x2, y2);
      paths.push(`<path d="${d}" stroke="#ffffff" stroke-width="13" stroke-linecap="round" fill="none" opacity="0.92"/>`);
      paths.push(`<path d="${d}" stroke="${col.pipe}" stroke-width="8" stroke-linecap="round" fill="none"/>`);
      paths.push(`<path d="${d}" stroke="${col.water}" stroke-width="4" stroke-linecap="round" fill="none" class="fp-water-flow"/>`);
    });

    // 3. Draw active dragged hose
    if (runtime.drag) {
      const { spkIdx, x, y } = runtime.drag;
      const portEl = document.getElementById(`fp-nozzle-${spkIdx}`);
      if (portEl) {
        const pR = portEl.getBoundingClientRect();
        const x1 = pR.right - bRect.left;
        const y1 = pR.top + pR.height / 2 - bRect.top;
        const col = NOZZLE_PIPES[spkIdx % NOZZLE_PIPES.length];
        const d = makeBezierPath(x1, y1, x, y);
        paths.push(`<path d="${d}" stroke="#ffffff" stroke-width="13" stroke-linecap="round" fill="none" opacity="0.88"/>`);
        paths.push(`<path d="${d}" stroke="${col.pipe}" stroke-width="8" stroke-linecap="round" fill="none"/>`);
      }
    }

    svg.innerHTML = paths.join("");
  }

  function renderGame(container, lessonSet) {
    injectStyles();
    cleanup();

    runtime.rounds = buildSentencePool(lessonSet);
    runtime.roundIdx = 0;
    runtime.matched = {};
    runtime.selectedSpeakerIdx = null;
    runtime.drag = null;
    runtime.totalScore = 0;
    runtime.totalFlowers = 0;

    function drawRound() {
      const round = runtime.rounds[runtime.roundIdx];
      if (!round) return;
      const matchedMap = runtime.matched[runtime.roundIdx] || (runtime.matched[runtime.roundIdx] = {});
      const matchedSpeakerIndices = new Set(Object.values(matchedMap));
      const matchedCount = Object.keys(matchedMap).length;
      const unitId = lessonSet?.unitId || (getBridge().getState?.()?.ui?.unitId) || 1;

      container.innerHTML = `
        <div class="fp-garden">
          <div class="fp-lawn" aria-hidden="true"></div>
          <div class="fp-hud">
            <div class="btn-group">
              <span class="mini-pill" style="background:#fde047; color:#713f12;">🚿 Vòng ${runtime.roundIdx + 1}/${runtime.rounds.length}</span>
              <span class="mini-pill" style="background:#dcfce7; color:#166534;">🌸 Đã tưới: ${matchedCount}/3</span>
              <span class="mini-pill" style="background:#e0f2fe; color:#075985;">📘 Unit ${unitId} • Activity 2</span>
            </div>
            <div class="btn-group">
              <button type="button" class="btn-3d ${runtime.lessonFilter === "all" ? "btn-pink" : "btn-soft-sky"}" data-fplesson="all" style="min-height:40px; padding:6px 11px; font-size:12.5px;">L1 + L2</button>
              <button type="button" class="btn-3d ${runtime.lessonFilter === "1" ? "btn-pink" : "btn-soft-sky"}" data-fplesson="1" style="min-height:40px; padding:6px 11px; font-size:12.5px;">Lesson 1</button>
              <button type="button" class="btn-3d ${runtime.lessonFilter === "2" ? "btn-pink" : "btn-soft-sky"}" data-fplesson="2" style="min-height:40px; padding:6px 11px; font-size:12.5px;">Lesson 2</button>
              <button type="button" class="btn-3d ${runtime.showHint ? "btn-yellow" : "btn-soft-mint"}" id="fp-toggle-hint" style="min-height:40px; padding:6px 11px; font-size:12.5px;">💡 Nghĩa</button>
            </div>
          </div>

          <div class="fp-prompt-pill">
            🔊 Chạm nút loa để nghe <strong>Listen, point and say</strong>, rồi kéo ống nước (hoặc chạm) tới câu đúng để tưới hoa nhé!
          </div>

          <div class="fp-board" id="fp-board">
            <svg class="fp-wires-svg" id="fp-wires-svg" aria-hidden="true"></svg>

            <!-- LEFT: 3 SPEAKER HOSE NOZZLES -->
            <div class="fp-col">
              ${round.speakers.map((sItem, spkIdx) => {
                const pipeCol = NOZZLE_PIPES[spkIdx % NOZZLE_PIPES.length];
                const isDone = matchedSpeakerIndices.has(spkIdx);
                const isSelected = runtime.selectedSpeakerIdx === spkIdx;
                return `
                  <div class="fp-speaker-row">
                    <button type="button"
                      class="fp-speaker-btn ${isSelected ? "is-active" : ""} ${isDone ? "is-done" : ""}"
                      id="fp-spk-${spkIdx}"
                      data-spk-idx="${spkIdx}"
                      title="Nghe &amp; kéo ống nước">🔊</button>
                    <div class="fp-nozzle-port" id="fp-nozzle-${spkIdx}" data-spk-idx="${spkIdx}" style="background:${pipeCol.pipe};">
                      <span class="fp-nozzle-dot"></span>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>

            <!-- CENTER: 3 ACTIVITY 2 SENTENCE PILLS -->
            <div class="fp-col">
              ${round.cards.map((cItem, cardIdx) => {
                const isWatered = matchedMap[cItem.uid] !== undefined;
                return `
                  <div class="fp-sentence-card ${isWatered ? "is-watered" : ""}" id="fp-card-${cardIdx}" data-card-idx="${cardIdx}">
                    <span class="fp-socket-left" id="fp-sock-${cardIdx}"></span>
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:2px;">
                      <span style="font-size:11px; font-weight:900; padding:2px 8px; border-radius:99px; background:${cItem.lesson === 1 ? '#e0f2fe' : '#fce7f3'}; color:${cItem.lesson === 1 ? '#0369a1' : '#be185d'};">
                        Lesson ${cItem.lesson || 1} • Act 2
                      </span>
                      <span style="font-size:18px;">${cItem.icon || "🌸"}</span>
                    </div>
                    <div style="font-size:14.5px; font-weight:800; line-height:1.35;">${cItem.en}</div>
                    ${runtime.showHint && cItem.vi ? `<div style="font-size:12px; font-weight:700; color:#475569; margin-top:3px;">(${cItem.vi})</div>` : ""}
                    <span class="fp-socket-right"></span>
                  </div>
                `;
              }).join("")}
            </div>

            <!-- RIGHT: 3 POTTED FLOWERS -->
            <div class="fp-col">
              ${round.cards.map((cItem, rowIdx) => {
                const isWatered = matchedMap[cItem.uid] !== undefined;
                return `
                  <div class="fp-pot-slot" id="fp-pot-${rowIdx}">
                    ${renderFlowerPotSvg(rowIdx, isWatered)}
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <div class="feedback-banner" id="fp-fb" style="position:relative; z-index:4;"></div>
        </div>
      `;

      // Wire lesson filter & hint buttons
      container.querySelectorAll("[data-fplesson]").forEach(btn => {
        btn.addEventListener("click", () => {
          runtime.lessonFilter = btn.dataset.fplesson;
          runtime.rounds = buildSentencePool(lessonSet);
          runtime.roundIdx = 0;
          runtime.matched = {};
          runtime.selectedSpeakerIdx = null;
          drawRound();
        });
      });

      document.getElementById("fp-toggle-hint")?.addEventListener("click", () => {
        runtime.showHint = !runtime.showHint;
        drawRound();
      });

      function attemptConnect(spkIdx, cardIdx) {
        const spkItem = round.speakers[spkIdx];
        const cardItem = round.cards[cardIdx];
        if (!spkItem || !cardItem) return;
        if (matchedMap[cardItem.uid] !== undefined) return;
        if (Object.values(matchedMap).includes(spkIdx)) return;

        const b = getBridge();
        const fb = document.getElementById("fp-fb");
        if (spkItem.uid === cardItem.uid) {
          matchedMap[cardItem.uid] = spkIdx;
          runtime.selectedSpeakerIdx = null;
          runtime.totalScore++;
          runtime.totalFlowers += 2;
          playWaterAndBloomSFX();
          speakSentence(cardItem.en);
          b.addFlower?.(2);
          b.launchConfetti?.(16);
          global.MunCompanion?.onCorrect?.(`Tuyệt vời! Hoa đã nở rực rỡ với câu: "${cardItem.en}" (+2 🌸)`);
          drawRound();

          if (Object.keys(matchedMap).length === round.cards.length) {
            setTimeout(() => {
              b.launchConfetti?.(36);
              if (runtime.roundIdx + 1 >= runtime.rounds.length) {
                b.renderPlayCompleted?.(
                  container,
                  "Vườn Hoa Ngữ Pháp Rực Rỡ!",
                  `Bé đã tưới nở ${runtime.totalScore} khóm hoa mẫu câu Activity 2 (Lesson 1 & 2)!`,
                  runtime.totalFlowers
                );
              } else {
                runtime.roundIdx++;
                drawRound();
              }
            }, 1350);
          }
        } else {
          playWrongBoingSFX();
          const cardEl = document.getElementById(`fp-card-${cardIdx}`);
          if (cardEl) {
            cardEl.classList.remove("is-wrong");
            void cardEl.offsetWidth;
            cardEl.classList.add("is-wrong");
          }
          b.recordMistake?.(spkItem);
          global.MunCompanion?.onWrong?.(`Hic, ống nước chưa khớp rồi! Hãy bấm loa nghe lại rồi nối đúng mẫu câu nhé! 🥺`);
          if (fb) {
            fb.className = "feedback-banner show err";
            fb.textContent = "💧 Chưa khớp mẫu câu vừa nghe! Bấm loa 🔊 nghe lại câu rồi thử nối lại nha!";
          }
        }
      }

      const board = document.getElementById("fp-board");

      function getHitCardIdx(clientX, clientY) {
        const els = container.querySelectorAll(".fp-sentence-card");
        for (const el of els) {
          const r = el.getBoundingClientRect();
          if (clientX >= r.left - 18 && clientX <= r.right + 12 && clientY >= r.top - 10 && clientY <= r.bottom + 10) {
            return Number(el.dataset.cardIdx);
          }
        }
        return -1;
      }

      // Pointer drag + click support on speakers & nozzles
      container.querySelectorAll("[data-spk-idx]").forEach(el => {
        el.addEventListener("pointerdown", (e) => {
          const spkIdx = Number(el.dataset.spkIdx);
          if (matchedSpeakerIndices.has(spkIdx)) return;
          e.preventDefault();

          runtime.selectedSpeakerIdx = spkIdx;
          container.querySelectorAll(".fp-speaker-btn").forEach(b => b.classList.toggle("is-active", Number(b.dataset.spkIdx) === spkIdx));

          playSpeakerPing();
          speakSentence(round.speakers[spkIdx].en);
          global.MunCompanion?.resetIdleTimer?.();

          const bRect = board.getBoundingClientRect();
          let moved = false;
          const startX = e.clientX;
          const startY = e.clientY;
          runtime.drag = { spkIdx, x: e.clientX - bRect.left, y: e.clientY - bRect.top };
          drawWires();

          function onMove(ev) {
            if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6) moved = true;
            const r = board.getBoundingClientRect();
            runtime.drag = { spkIdx, x: ev.clientX - r.left, y: ev.clientY - r.top };
            const hit = getHitCardIdx(ev.clientX, ev.clientY);
            container.querySelectorAll(".fp-sentence-card").forEach(c => {
              c.classList.toggle("is-drop-hover", Number(c.dataset.cardIdx) === hit && !c.classList.contains("is-watered"));
            });
            drawWires();
          }

          function onUp(ev) {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
            container.querySelectorAll(".fp-sentence-card").forEach(c => c.classList.remove("is-drop-hover"));

            const hit = moved ? getHitCardIdx(ev.clientX, ev.clientY) : -1;
            runtime.drag = null;
            drawWires();
            if (hit >= 0) {
              attemptConnect(spkIdx, hit);
            }
          }

          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
          window.addEventListener("pointercancel", onUp);
        });
      });

      // Tap-to-connect on center sentence cards
      container.querySelectorAll(".fp-sentence-card").forEach(cardEl => {
        cardEl.addEventListener("click", () => {
          const cardIdx = Number(cardEl.dataset.cardIdx);
          if (runtime.selectedSpeakerIdx !== null) {
            attemptConnect(runtime.selectedSpeakerIdx, cardIdx);
          } else {
            // If no speaker selected yet, speak this card gently as a helpful clue
            playSpeakerPing();
            speakSentence(round.cards[cardIdx].en);
          }
        });
      });

      requestAnimationFrame(() => drawWires());
    }

    runtime.resizeHandler = () => drawWires();
    window.addEventListener("resize", runtime.resizeHandler);
    drawRound();
  }

  function cleanup() {
    if (runtime.resizeHandler) {
      window.removeEventListener("resize", runtime.resizeHandler);
      runtime.resizeHandler = null;
    }
    runtime.drag = null;
  }

  global.FlowerPipeModule = {
    renderGame,
    cleanup,
    getBank: () => UNIT_LISTEN_POINT_SAY
  };
})(window);
