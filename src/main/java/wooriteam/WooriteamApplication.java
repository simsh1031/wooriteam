package wooriteam;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class WooriteamApplication {

	public static void main(String[] args) {
		SpringApplication.run(WooriteamApplication.class, args);
	}

}
